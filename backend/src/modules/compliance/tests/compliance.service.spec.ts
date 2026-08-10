import { NotFoundException } from '@nestjs/common'
import { ComplianceService, ERASURE_GRACE_DAYS } from '../compliance.service'

function makePrisma(overrides: any = {}) {
  return {
    athlete: {
      findFirst: jest.fn().mockResolvedValue({ id: 'ath-1', orgId: 'org', deletedAt: null }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    wellnessSurvey: { findMany: jest.fn().mockResolvedValue([{ id: 'w1' }]) },
    athleteSessionLoad: { findMany: jest.fn().mockResolvedValue([]) },
    athleteLoadCalculation: { findMany: jest.fn().mockResolvedValue([]) },
    injury: { findMany: jest.fn().mockResolvedValue([]) },
    alert: { findMany: jest.fn().mockResolvedValue([]) },
    erasureRequest: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'er-1', status: 'PENDING', ...data })),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'er-1', ...data })),
    },
    ...overrides,
  }
}

describe('ComplianceService.exportAthleteData', () => {
  it('assembles the athlete and all related records', async () => {
    const prisma = makePrisma()
    prisma.athlete.findFirst.mockResolvedValue({ id: 'ath-1', orgId: 'org', position: { name: 'MID' } })
    const svc = new ComplianceService(prisma as any)
    const out: any = await svc.exportAthleteData('org', 'ath-1')
    expect(out.subject).toBe('athlete')
    expect(out.counts.wellnessSurveys).toBe(1)
    expect(out.records.wellnessSurveys).toHaveLength(1)
  })

  it('throws when the athlete is missing', async () => {
    const prisma = makePrisma()
    prisma.athlete.findFirst.mockResolvedValue(null)
    const svc = new ComplianceService(prisma as any)
    await expect(svc.exportAthleteData('org', 'nope')).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('ComplianceService.requestErasure', () => {
  it('soft-deletes the athlete and schedules a hard delete', async () => {
    const prisma = makePrisma()
    const svc = new ComplianceService(prisma as any)
    const before = Date.now()
    const req: any = await svc.requestErasure('org', 'ath-1', 'user', 'left club')
    expect(prisma.athlete.update).toHaveBeenCalledWith({ where: { id: 'ath-1' }, data: { deletedAt: expect.any(Date) } })
    const days = Math.round((new Date(req.scheduledFor).getTime() - before) / 86_400_000)
    expect(days).toBe(ERASURE_GRACE_DAYS)
  })

  it('reuses an existing pending request', async () => {
    const prisma = makePrisma()
    prisma.erasureRequest.findFirst.mockResolvedValue({ id: 'existing', status: 'PENDING' })
    const svc = new ComplianceService(prisma as any)
    const req: any = await svc.requestErasure('org', 'ath-1')
    expect(req.id).toBe('existing')
    expect(prisma.erasureRequest.create).not.toHaveBeenCalled()
  })
})

describe('ComplianceService.cancelErasure', () => {
  it('cancels and restores the athlete', async () => {
    const prisma = makePrisma()
    prisma.erasureRequest.findFirst.mockResolvedValue({ id: 'er-1', status: 'PENDING', athleteId: 'ath-1' })
    const svc = new ComplianceService(prisma as any)
    const res: any = await svc.cancelErasure('er-1', 'org')
    expect(res.status).toBe('CANCELLED')
    expect(prisma.athlete.update).toHaveBeenCalledWith({ where: { id: 'ath-1' }, data: { deletedAt: null } })
  })
})

describe('ComplianceService.processDueErasures', () => {
  it('hard-deletes athletes whose grace period has elapsed', async () => {
    const prisma = makePrisma()
    prisma.erasureRequest.findMany.mockResolvedValue([
      { id: 'er-1', orgId: 'org', athleteId: 'ath-1' },
      { id: 'er-2', orgId: 'org', athleteId: 'ath-2' },
    ])
    const svc = new ComplianceService(prisma as any)
    const res = await svc.processDueErasures(new Date())
    expect(res).toEqual({ erased: 2, due: 2 })
    expect(prisma.athlete.delete).toHaveBeenCalledTimes(2)
    expect(prisma.erasureRequest.update).toHaveBeenCalledTimes(2)
  })
})
