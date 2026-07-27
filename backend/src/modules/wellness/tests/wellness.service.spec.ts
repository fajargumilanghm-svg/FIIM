import { BadRequestException, NotFoundException } from '@nestjs/common'
import { WellnessService } from '../wellness.service'

function makePrisma(overrides: any = {}) {
  return {
    wellnessSurvey: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: any) => ({ id: 'w1', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => ({ id: 'w1', ...data })),
      delete: jest.fn().mockResolvedValue({}),
    },
    ...overrides,
  }
}

describe('WellnessService', () => {
  describe('create', () => {
    it('rejects a duplicate survey for the same athlete/date', async () => {
      const prisma = makePrisma()
      prisma.wellnessSurvey.findUnique.mockResolvedValue({ id: 'dup' })
      const svc = new WellnessService(prisma as any)
      await expect(
        svc.create('org', { athleteId: 'a1', surveyDate: '2026-07-01' } as any),
      ).rejects.toThrow(BadRequestException)
    })

    it('computes wellnessScore as the metric average and sets source', async () => {
      const prisma = makePrisma()
      const svc = new WellnessService(prisma as any)
      const res: any = await svc.create('org', {
        athleteId: 'a1',
        surveyDate: '2026-07-01',
        sleepQuality: 8,
        mood: 6,
      } as any)
      expect(res.wellnessScore).toBe(7)
      expect(res.source).toBe('WEB')
    })

    it('marks source STAFF when submitted on behalf', async () => {
      const prisma = makePrisma()
      const svc = new WellnessService(prisma as any)
      const res: any = await svc.create(
        'org',
        { athleteId: 'a1', surveyDate: '2026-07-01', mood: 5 } as any,
        'staff-1',
      )
      expect(res.source).toBe('STAFF')
    })
  })

  describe('update', () => {
    it('throws when survey missing', async () => {
      const svc = new WellnessService(makePrisma() as any)
      await expect(svc.update('w1', 'org', {} as any)).rejects.toThrow(NotFoundException)
    })

    it('recomputes wellnessScore from merged values', async () => {
      const prisma = makePrisma()
      prisma.wellnessSurvey.findFirst.mockResolvedValue({ id: 'w1', mood: 4 })
      const svc = new WellnessService(prisma as any)
      const res: any = await svc.update('w1', 'org', { mood: 8, sleepQuality: 6 } as any)
      expect(res.wellnessScore).toBe(7)
    })
  })

  describe('remove', () => {
    it('throws when survey missing', async () => {
      const svc = new WellnessService(makePrisma() as any)
      await expect(svc.remove('w1', 'org')).rejects.toThrow(NotFoundException)
    })

    it('deletes an existing survey', async () => {
      const prisma = makePrisma()
      prisma.wellnessSurvey.findFirst.mockResolvedValue({ id: 'w1' })
      const svc = new WellnessService(prisma as any)
      const res = await svc.remove('w1', 'org')
      expect(res.message).toMatch(/deleted/i)
      expect(prisma.wellnessSurvey.delete).toHaveBeenCalledWith({ where: { id: 'w1' } })
    })
  })

  describe('findAll', () => {
    it('applies athlete and date filters', async () => {
      const prisma = makePrisma()
      const svc = new WellnessService(prisma as any)
      await svc.findAll('org', { athleteId: 'a1', dateFrom: '2026-07-01', dateTo: '2026-07-10' })
      const where = prisma.wellnessSurvey.findMany.mock.calls[0][0].where
      expect(where.athleteId).toBe('a1')
      expect(where.surveyDate.gte).toBeInstanceOf(Date)
      expect(where.surveyDate.lte).toBeInstanceOf(Date)
    })
  })

  describe('findOne', () => {
    it('throws when not found', async () => {
      const svc = new WellnessService(makePrisma() as any)
      await expect(svc.findOne('w1', 'org')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getTeamAverage', () => {
    it('averages metrics grouped by date, sorted ascending', async () => {
      const prisma = makePrisma()
      prisma.wellnessSurvey.findMany.mockResolvedValue([
        { surveyDate: new Date('2026-07-02'), wellnessScore: 8, mood: 8, sleepQuality: 8, fatigueLevel: 4, stressLevel: 3, muscleSoreness: 2, hydration: 7, nutrition: 6 },
        { surveyDate: new Date('2026-07-01'), wellnessScore: 6, mood: 6, sleepQuality: 6, fatigueLevel: 5, stressLevel: 4, muscleSoreness: 3, hydration: 6, nutrition: 5 },
        { surveyDate: new Date('2026-07-01'), wellnessScore: 4, mood: 4, sleepQuality: 4, fatigueLevel: 6, stressLevel: 5, muscleSoreness: 4, hydration: 5, nutrition: 4 },
      ])
      const svc = new WellnessService(prisma as any)
      const res = await svc.getTeamAverage('org', '2026-07-01', '2026-07-31')
      expect(res).toHaveLength(2)
      expect(res[0].date).toBe('2026-07-01')
      expect(res[0].responseCount).toBe(2)
      expect(res[0].wellnessScore).toBe(5) // (6+4)/2
      expect(res[1].date).toBe('2026-07-02')
    })
  })

  describe('getAthleteTrend', () => {
    it('maps surveys to date-keyed trend points', async () => {
      const prisma = makePrisma()
      prisma.wellnessSurvey.findMany.mockResolvedValue([
        { surveyDate: new Date('2026-07-01'), wellnessScore: 7, sleepQuality: 8, fatigueLevel: 4, mood: 7, stressLevel: 3, muscleSoreness: 2 },
      ])
      const svc = new WellnessService(prisma as any)
      const res = await svc.getAthleteTrend('a1', 'org', 14)
      expect(res[0]).toMatchObject({ date: '2026-07-01', wellnessScore: 7 })
    })
  })
})
