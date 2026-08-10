import { ForbiddenException, BadRequestException } from '@nestjs/common'
import { Role, RtpStage, RtpStageStatus } from '@prisma/client'
import { InjuryMedicalService, canViewClinical, RTP_ORDER } from '../injury-medical.service'

const injuryRow = { id: 'inj-1', orgId: 'org-1', deletedAt: null }

function makePrisma(overrides: any = {}) {
  return {
    injury: {
      findFirst: jest.fn().mockResolvedValue(injuryRow),
      update: jest.fn().mockResolvedValue(injuryRow),
    },
    injuryRtpProgress: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'p-new', ...data })),
      update: jest.fn().mockResolvedValue({}),
    },
    injuryDiagnosis: { findMany: jest.fn().mockResolvedValue([]) },
    injuryTreatmentNote: { findMany: jest.fn().mockResolvedValue([]) },
    medicalClearance: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    ...overrides,
  }
}

describe('canViewClinical', () => {
  it('grants medical + admin roles, denies coach/analyst', () => {
    expect(canViewClinical(Role.MEDICAL_STAFF)).toBe(true)
    expect(canViewClinical(Role.ORGANIZATION_ADMIN)).toBe(true)
    expect(canViewClinical(Role.COACH)).toBe(false)
    expect(canViewClinical(Role.ANALYST)).toBe(false)
    expect(canViewClinical(undefined)).toBe(false)
  })
})

describe('RTP_ORDER', () => {
  it('is the 5-stage continuum ending at return-to-play', () => {
    expect(RTP_ORDER).toHaveLength(5)
    expect(RTP_ORDER[0]).toBe(RtpStage.REST)
    expect(RTP_ORDER[4]).toBe(RtpStage.RETURN_TO_PLAY)
  })
})

describe('InjuryMedicalService — clinical access control', () => {
  it('blocks non-clinical roles from listing diagnoses', async () => {
    const svc = new InjuryMedicalService(makePrisma() as any)
    await expect(svc.listDiagnoses('inj-1', 'org-1', Role.COACH)).rejects.toBeInstanceOf(
      ForbiddenException,
    )
  })

  it('allows medical staff to list diagnoses', async () => {
    const prisma = makePrisma()
    const svc = new InjuryMedicalService(prisma as any)
    await expect(
      svc.listDiagnoses('inj-1', 'org-1', Role.MEDICAL_STAFF),
    ).resolves.toEqual([])
    expect(prisma.injuryDiagnosis.findMany).toHaveBeenCalled()
  })
})

describe('InjuryMedicalService — case segregation', () => {
  it('hides clinical data from coaches', async () => {
    const svc = new InjuryMedicalService(makePrisma() as any)
    const res: any = await svc.getCaseDetail('inj-1', 'org-1', Role.COACH)
    expect(res.clinicalAccess).toBe(false)
    expect(res.diagnoses).toBeUndefined()
    expect(res).toHaveProperty('currentRtpStage')
  })

  it('includes clinical data for medical staff', async () => {
    const svc = new InjuryMedicalService(makePrisma() as any)
    const res: any = await svc.getCaseDetail('inj-1', 'org-1', Role.MEDICAL_STAFF)
    expect(res.clinicalAccess).toBe(true)
    expect(res.diagnoses).toBeDefined()
    expect(res.clearances).toBeDefined()
  })
})

describe('InjuryMedicalService — RTP advance gating', () => {
  it('rejects advancing when a criterion is unmet', async () => {
    const prisma = makePrisma()
    prisma.injuryRtpProgress.findFirst.mockResolvedValue({
      id: 'p1',
      stage: RtpStage.REST,
      status: RtpStageStatus.IN_PROGRESS,
      criteria: [{ label: 'Pain-free', met: false }],
    })
    const svc = new InjuryMedicalService(prisma as any)
    await expect(svc.advanceStage('inj-1', 'org-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })

  it('requires a valid clearance before return-to-play', async () => {
    const prisma = makePrisma()
    prisma.injuryRtpProgress.findFirst.mockResolvedValue({
      id: 'p4',
      stage: RtpStage.RETURN_TO_TRAINING,
      status: RtpStageStatus.IN_PROGRESS,
      criteria: [{ label: 'Full training', met: true }],
    })
    prisma.medicalClearance.findFirst.mockResolvedValue(null) // no clearance
    const svc = new InjuryMedicalService(prisma as any)
    await expect(svc.advanceStage('inj-1', 'org-1', {})).rejects.toBeInstanceOf(
      ForbiddenException,
    )
  })

  it('advances to return-to-play when cleared', async () => {
    const prisma = makePrisma()
    prisma.injuryRtpProgress.findFirst.mockResolvedValue({
      id: 'p4',
      stage: RtpStage.RETURN_TO_TRAINING,
      status: RtpStageStatus.IN_PROGRESS,
      criteria: [{ label: 'Full training', met: true }],
    })
    prisma.medicalClearance.findFirst.mockResolvedValue({ id: 'clr-1', status: 'CLEARED' })
    const svc = new InjuryMedicalService(prisma as any)
    const next: any = await svc.advanceStage('inj-1', 'org-1', {})
    expect(next.stage).toBe(RtpStage.RETURN_TO_PLAY)
    expect(prisma.injuryRtpProgress.update).toHaveBeenCalled() // completed prior stage
  })

  it('advances a mid-pathway stage without needing clearance', async () => {
    const prisma = makePrisma()
    prisma.injuryRtpProgress.findFirst.mockResolvedValue({
      id: 'p1',
      stage: RtpStage.REST,
      status: RtpStageStatus.IN_PROGRESS,
      criteria: [],
    })
    const svc = new InjuryMedicalService(prisma as any)
    const next: any = await svc.advanceStage('inj-1', 'org-1', {})
    expect(next.stage).toBe(RtpStage.RECOVERY)
    expect(prisma.medicalClearance.findFirst).not.toHaveBeenCalled()
  })
})
