import { NotFoundException } from '@nestjs/common'
import { TrainingLoadService } from '../training-load.service'

function makePrisma(overrides: any = {}) {
  return {
    trainingSession: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: any) => ({ id: 's1', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => ({ id: 's1', ...data })),
    },
    athleteSessionLoad: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }: any) => ({ id: 'l1', ...data })),
    },
    ...overrides,
  }
}

describe('TrainingLoadService', () => {
  describe('findAllSessions', () => {
    it('applies team and date filters', async () => {
      const prisma = makePrisma()
      const svc = new TrainingLoadService(prisma as any)
      await svc.findAllSessions('org', { teamId: 't1', dateFrom: '2026-07-01', dateTo: '2026-07-10' })
      const where = prisma.trainingSession.findMany.mock.calls[0][0].where
      expect(where).toMatchObject({ orgId: 'org', deletedAt: null, teamId: 't1' })
      expect(where.scheduledDate.gte).toBeInstanceOf(Date)
      expect(where.scheduledDate.lte).toBeInstanceOf(Date)
    })
  })

  describe('findSessionById', () => {
    it('throws when not found', async () => {
      const svc = new TrainingLoadService(makePrisma() as any)
      await expect(svc.findSessionById('s1', 'org')).rejects.toThrow(NotFoundException)
    })
  })

  describe('createSession', () => {
    it('defaults type/status and coerces dates', async () => {
      const prisma = makePrisma()
      const svc = new TrainingLoadService(prisma as any)
      const res: any = await svc.createSession('org', {
        name: 'AM',
        scheduledDate: '2026-07-01',
        startTime: '2026-07-01T08:00:00Z',
      } as any)
      expect(res.sessionType).toBe('TRAINING')
      expect(res.status).toBe('SCHEDULED')
      expect(res.scheduledDate).toBeInstanceOf(Date)
      expect(res.startTime).toBeInstanceOf(Date)
    })
  })

  describe('updateSession', () => {
    it('throws when missing', async () => {
      const svc = new TrainingLoadService(makePrisma() as any)
      await expect(svc.updateSession('s1', 'org', { name: 'x' } as any)).rejects.toThrow(NotFoundException)
    })

    it('updates an existing session', async () => {
      const prisma = makePrisma()
      prisma.trainingSession.findFirst.mockResolvedValue({ id: 's1' })
      const svc = new TrainingLoadService(prisma as any)
      await svc.updateSession('s1', 'org', { name: 'PM', scheduledDate: '2026-07-02' } as any)
      expect(prisma.trainingSession.update).toHaveBeenCalled()
    })
  })

  describe('deleteSession', () => {
    it('throws when missing', async () => {
      const svc = new TrainingLoadService(makePrisma() as any)
      await expect(svc.deleteSession('s1', 'org')).rejects.toThrow(NotFoundException)
    })

    it('soft-deletes and cancels', async () => {
      const prisma = makePrisma()
      prisma.trainingSession.findFirst.mockResolvedValue({ id: 's1' })
      const svc = new TrainingLoadService(prisma as any)
      const res = await svc.deleteSession('s1', 'org')
      expect(res.message).toMatch(/deleted/i)
      const data = prisma.trainingSession.update.mock.calls[0][0].data
      expect(data.deletedAt).toBeInstanceOf(Date)
      expect(data.status).toBe('CANCELLED')
    })
  })

  describe('addAthleteLoad', () => {
    it('throws when the session does not exist', async () => {
      const svc = new TrainingLoadService(makePrisma() as any)
      await expect(
        svc.addAthleteLoad('s1', 'org', { athleteId: 'a1' } as any),
      ).rejects.toThrow(NotFoundException)
    })

    it('computes totalLoad = rpe × duration', async () => {
      const prisma = makePrisma()
      prisma.trainingSession.findFirst.mockResolvedValue({ id: 's1' })
      const svc = new TrainingLoadService(prisma as any)
      const res: any = await svc.addAthleteLoad('s1', 'org', {
        athleteId: 'a1',
        rpeScore: 7,
        durationMinutes: 60,
      } as any)
      expect(res.totalLoad).toBe(420)
    })

    it('leaves totalLoad null when rpe or duration is absent', async () => {
      const prisma = makePrisma()
      prisma.trainingSession.findFirst.mockResolvedValue({ id: 's1' })
      const svc = new TrainingLoadService(prisma as any)
      const res: any = await svc.addAthleteLoad('s1', 'org', { athleteId: 'a1', rpeScore: 7 } as any)
      expect(res.totalLoad).toBeNull()
    })
  })

  describe('getAthleteLoadHistory', () => {
    it('queries a date-bounded window', async () => {
      const prisma = makePrisma()
      const svc = new TrainingLoadService(prisma as any)
      await svc.getAthleteLoadHistory('a1', 'org', 7)
      const where = prisma.athleteSessionLoad.findMany.mock.calls[0][0].where
      expect(where.athleteId).toBe('a1')
      expect(where.createdAt.gte).toBeInstanceOf(Date)
    })
  })
})
