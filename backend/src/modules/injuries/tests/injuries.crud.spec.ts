import { NotFoundException } from '@nestjs/common'
import { InjuriesService } from '../injuries.service'

function makePrisma(overrides: any = {}) {
  return {
    injury: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: any) => ({ id: 'i1', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => ({ id: 'i1', ...data })),
      count: jest.fn().mockResolvedValue(0),
    },
    athlete: {
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    ...overrides,
  }
}

describe('InjuriesService CRUD', () => {
  describe('findAll', () => {
    it('applies status/severity/athlete filters', async () => {
      const prisma = makePrisma()
      const svc = new InjuriesService(prisma as any)
      await svc.findAll('org', { status: 'OPEN', severity: 'SEVERE', athleteId: 'a1' } as any)
      const where = prisma.injury.findMany.mock.calls[0][0].where
      expect(where).toMatchObject({ orgId: 'org', deletedAt: null, status: 'OPEN', severity: 'SEVERE', athleteId: 'a1' })
    })
  })

  describe('findOne', () => {
    it('throws when missing', async () => {
      const svc = new InjuriesService(makePrisma() as any)
      await expect(svc.findOne('i1', 'org')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('flags the athlete INJURED and logs an audit entry', async () => {
      const prisma = makePrisma()
      const audit = { log: jest.fn() }
      const svc = new InjuriesService(prisma as any, audit as any)
      await svc.create('org', { athleteId: 'a1', bodyPart: 'Knee', onsetDate: '2026-07-01' } as any, 'u1')
      expect(prisma.athlete.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { status: 'INJURED' } })
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE', containsMedicalData: true }))
    })
  })

  describe('update', () => {
    it('throws when missing', async () => {
      const svc = new InjuriesService(makePrisma() as any)
      await expect(svc.update('i1', 'org', {} as any)).rejects.toThrow(NotFoundException)
    })

    it('derives days-lost and severity when resolving', async () => {
      const prisma = makePrisma()
      prisma.injury.findFirst.mockResolvedValue({
        id: 'i1',
        athleteId: 'a1',
        onsetDate: new Date('2026-07-01'),
        actualReturnDate: null,
        daysLost: 0,
        severity: 'MINOR',
      })
      prisma.injury.count.mockResolvedValue(0)
      prisma.athlete.findFirst.mockResolvedValue({ id: 'a1', status: 'INJURED' })
      const svc = new InjuriesService(prisma as any)
      await svc.update('i1', 'org', { status: 'RESOLVED', actualReturnDate: '2026-08-01' } as any)
      const data = prisma.injury.update.mock.calls[0][0].data
      expect(data.daysLost).toBe(31)
      expect(data.severity).toBe('SEVERE')
      // No active injuries remain -> athlete returns to ACTIVE
      expect(prisma.athlete.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { status: 'ACTIVE' } })
    })

    it('keeps the athlete injured when other active injuries remain', async () => {
      const prisma = makePrisma()
      prisma.injury.findFirst.mockResolvedValue({
        id: 'i1',
        athleteId: 'a1',
        onsetDate: new Date('2026-07-01'),
        daysLost: 5,
        severity: 'MINOR',
      })
      prisma.injury.count.mockResolvedValue(1) // still has active injuries
      const svc = new InjuriesService(prisma as any)
      await svc.update('i1', 'org', { status: 'RECOVERING' } as any)
      expect(prisma.athlete.update).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('throws when missing', async () => {
      const svc = new InjuriesService(makePrisma() as any)
      await expect(svc.remove('i1', 'org')).rejects.toThrow(NotFoundException)
    })

    it('soft-deletes and re-syncs availability', async () => {
      const prisma = makePrisma()
      prisma.injury.findFirst.mockResolvedValue({ id: 'i1', athleteId: 'a1' })
      prisma.injury.count.mockResolvedValue(0)
      prisma.athlete.findFirst.mockResolvedValue({ id: 'a1', status: 'INJURED' })
      const svc = new InjuriesService(prisma as any)
      const res = await svc.remove('i1', 'org')
      expect(res.message).toMatch(/deleted/i)
      expect(prisma.injury.update.mock.calls[0][0].data.deletedAt).toBeInstanceOf(Date)
    })
  })
})
