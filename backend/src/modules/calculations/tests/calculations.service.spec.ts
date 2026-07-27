import { CalculationsService } from '../calculations.service'

const CONFIG = {
  acuteWindowDays: 7,
  chronicWindowDays: 21,
  veryLowThreshold: 0.8,
  lowThreshold: 1.0,
  moderateThreshold: 1.3,
  highThreshold: 1.5,
  enableAcwr: true,
  enableEWMA: false,
  ewmaConstant: 0.5,
}

function makePrisma(overrides: any = {}) {
  return {
    algorithmConfiguration: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: any) => ({ ...CONFIG, ...data })),
      upsert: jest.fn().mockImplementation(({ create }: any) => ({ ...CONFIG, ...create })),
    },
    athleteSessionLoad: { findMany: jest.fn().mockResolvedValue([]) },
    athleteLoadCalculation: {
      upsert: jest.fn().mockImplementation(({ create }: any) => ({ id: 'calc1', ...create })),
      findMany: jest.fn().mockResolvedValue([]),
    },
    athlete: {
      findUnique: jest.fn().mockResolvedValue({ firstName: 'A', lastName: 'B', position: null }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    ...overrides,
  }
}

describe('CalculationsService', () => {
  describe('getAlgorithmConfig', () => {
    it('creates a default config when none exists', async () => {
      const prisma = makePrisma()
      const svc = new CalculationsService(prisma as any)
      await svc.getAlgorithmConfig('org')
      expect(prisma.algorithmConfiguration.create).toHaveBeenCalled()
    })

    it('returns the existing config', async () => {
      const prisma = makePrisma()
      prisma.algorithmConfiguration.findUnique.mockResolvedValue({ ...CONFIG, orgId: 'org' })
      const svc = new CalculationsService(prisma as any)
      const res = await svc.getAlgorithmConfig('org')
      expect(res).toMatchObject({ orgId: 'org' })
      expect(prisma.algorithmConfiguration.create).not.toHaveBeenCalled()
    })
  })

  describe('updateAlgorithmConfig', () => {
    it('upserts and logs CONFIG_CHANGED', async () => {
      const prisma = makePrisma()
      const audit = { log: jest.fn() }
      const svc = new CalculationsService(prisma as any, audit as any)
      await svc.updateAlgorithmConfig('org', { highThreshold: 1.6 })
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CONFIG_CHANGED' }))
      expect(prisma.algorithmConfiguration.upsert).toHaveBeenCalled()
    })
  })

  describe('calculateAthleteAcwr', () => {
    it('returns an insufficient-data message when no sessions exist', async () => {
      const prisma = makePrisma()
      prisma.algorithmConfiguration.findUnique.mockResolvedValue({ ...CONFIG, orgId: 'org' })
      const svc = new CalculationsService(prisma as any)
      const res: any = await svc.calculateAthleteAcwr('a1', 'org', new Date('2026-07-09'))
      expect(res.message).toMatch(/insufficient/i)
      expect(prisma.athleteLoadCalculation.upsert).not.toHaveBeenCalled()
    })

    it('persists a calculation when enough load data exists', async () => {
      const prisma = makePrisma()
      prisma.algorithmConfiguration.findUnique.mockResolvedValue({ ...CONFIG, orgId: 'org' })
      // 21 days of sessions so both windows are populated
      const sessions = []
      for (let i = 21; i >= 0; i--) {
        const d = new Date('2026-07-09')
        d.setDate(d.getDate() - i)
        sessions.push({ session: { scheduledDate: d }, createdAt: d, rpeScore: 6, durationMinutes: 60, distanceMeters: 0 })
      }
      prisma.athleteSessionLoad.findMany.mockResolvedValue(sessions)
      const svc = new CalculationsService(prisma as any)
      const res: any = await svc.calculateAthleteAcwr('a1', 'org', new Date('2026-07-09'))
      expect(prisma.athleteLoadCalculation.upsert).toHaveBeenCalled()
      expect(res.athlete).toBeDefined()
    })
  })

  describe('calculateAllAthletes', () => {
    it('iterates active athletes and collects results', async () => {
      const prisma = makePrisma()
      prisma.algorithmConfiguration.findUnique.mockResolvedValue({ ...CONFIG, orgId: 'org' })
      prisma.athlete.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }])
      const svc = new CalculationsService(prisma as any)
      const res = await svc.calculateAllAthletes('org', new Date('2026-07-09'))
      expect(res).toHaveLength(2)
    })
  })

  describe('getAthleteAcwrHistory', () => {
    it('queries a date-bounded window ascending', async () => {
      const prisma = makePrisma()
      const svc = new CalculationsService(prisma as any)
      await svc.getAthleteAcwrHistory('a1', 'org', 30)
      const args = prisma.athleteLoadCalculation.findMany.mock.calls[0][0]
      expect(args.where.athleteId).toBe('a1')
      expect(args.orderBy).toEqual({ calcDate: 'asc' })
    })
  })

  describe('getTeamAcwrSummary', () => {
    it('computes a risk distribution and at-risk percentage', async () => {
      const prisma = makePrisma()
      prisma.algorithmConfiguration.findUnique.mockResolvedValue({ ...CONFIG, orgId: 'org' })
      prisma.athlete.findMany.mockResolvedValue([]) // calculateAllAthletes finds none
      prisma.athleteLoadCalculation.findMany.mockResolvedValue([
        { athleteId: 'a1', acwr: 1.6, riskLevel: 'VERY_HIGH', athlete: { firstName: 'A', lastName: 'B', position: null } },
        { athleteId: 'a2', acwr: 1.1, riskLevel: 'MODERATE', athlete: { firstName: 'C', lastName: 'D', position: null } },
      ])
      const svc = new CalculationsService(prisma as any)
      const res = await svc.getTeamAcwrSummary('org', new Date('2026-07-09'))
      expect(res.totalAthletes).toBe(2)
      expect(res.atRiskCount).toBe(1)
      expect(res.atRiskPercentage).toBe(50)
    })
  })
})
