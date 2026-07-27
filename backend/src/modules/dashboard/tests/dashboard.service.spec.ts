import { DashboardService } from '../dashboard.service'

function makePrisma(overrides: any = {}) {
  return {
    athlete: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    userOrganization: { count: jest.fn().mockResolvedValue(0) },
    team: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    sport: { count: jest.fn().mockResolvedValue(0) },
    auditLog: { findMany: jest.fn().mockResolvedValue([]) },
    ...overrides,
  }
}

const calc = (overrides: any = {}) => ({ getTeamAcwrSummary: jest.fn(), ...overrides })

describe('DashboardService', () => {
  describe('getOverviewStats', () => {
    it('derives healthy = active - injured', async () => {
      const prisma = makePrisma()
      prisma.athlete.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(15) // active
        .mockResolvedValueOnce(3) // injured
        .mockResolvedValueOnce(2) // returning
      prisma.userOrganization.count.mockResolvedValueOnce(8).mockResolvedValueOnce(4)
      prisma.team.count.mockResolvedValue(3)
      prisma.sport.count.mockResolvedValue(2)
      const svc = new DashboardService(prisma as any, calc() as any)
      const res = await svc.getOverviewStats('org')
      expect(res.athletes).toMatchObject({ total: 20, active: 15, injured: 3, healthy: 12 })
      expect(res.staff).toEqual({ total: 8, coaches: 4 })
    })
  })

  describe('getAthleteStatusDistribution', () => {
    it('maps groupBy output', async () => {
      const prisma = makePrisma()
      prisma.athlete.groupBy.mockResolvedValue([{ status: 'ACTIVE', _count: { status: 5 } }])
      const svc = new DashboardService(prisma as any, calc() as any)
      const res = await svc.getAthleteStatusDistribution('org')
      expect(res).toEqual([{ status: 'ACTIVE', count: 5 }])
    })
  })

  describe('getTeamOverview', () => {
    it('summarizes team membership counts', async () => {
      const prisma = makePrisma()
      prisma.team.findMany.mockResolvedValue([
        {
          id: 't1',
          name: 'First XI',
          category: 'SENIOR',
          sport: { id: 's1', name: 'Soccer' },
          members: [
            { role: 'CAPTAIN', athlete: { id: 'a1', firstName: 'A', lastName: 'B', status: 'ACTIVE', jerseyNumber: 7, position: null } },
            { role: 'MEMBER', athlete: { id: 'a2', firstName: 'C', lastName: 'D', status: 'INJURED', jerseyNumber: 9, position: null } },
          ],
        },
      ])
      const svc = new DashboardService(prisma as any, calc() as any)
      const res = await svc.getTeamOverview('org')
      expect(res[0]).toMatchObject({ totalMembers: 2, activeMembers: 1, injuredMembers: 1 })
      expect(res[0].members[0].name).toBe('A B')
    })
  })

  describe('getRecentActivity', () => {
    it('maps athletes and audit logs, labeling system events', async () => {
      const prisma = makePrisma()
      prisma.athlete.findMany.mockResolvedValue([
        { id: 'a1', firstName: 'A', lastName: 'B', status: 'ACTIVE', updatedAt: new Date() },
      ])
      prisma.auditLog.findMany.mockResolvedValue([
        { id: 'l1', action: 'CREATE', entityType: 'athlete', description: 'x', user: null, createdAt: new Date() },
      ])
      const svc = new DashboardService(prisma as any, calc() as any)
      const res = await svc.getRecentActivity('org')
      expect(res.recentAthletes[0].name).toBe('A B')
      expect(res.recentAuditLogs[0].userName).toBe('System')
    })
  })

  describe('getAcwrSummary', () => {
    it('maps calc-engine athletes and derives trend', async () => {
      const calculations = calc({
        getTeamAcwrSummary: jest.fn().mockResolvedValue({
          athletes: [{ athleteId: 'a1', name: 'A B', acwr: 1.4, riskLevel: 'HIGH', riskColor: '#dc2626' }],
        }),
      })
      const svc = new DashboardService(makePrisma() as any, calculations as any)
      const res = await svc.getAcwrSummary('org')
      expect(res[0]).toMatchObject({ athleteId: 'a1', acwr: 1.4, trend: 'increasing' })
    })

    it('falls back to plain athlete list when the engine throws', async () => {
      const calculations = calc({
        getTeamAcwrSummary: jest.fn().mockRejectedValue(new Error('no data')),
      })
      const prisma = makePrisma()
      prisma.athlete.findMany.mockResolvedValue([
        { id: 'a1', firstName: 'A', lastName: 'B', position: { name: 'FW' } },
      ])
      const svc = new DashboardService(prisma as any, calculations as any)
      const res = await svc.getAcwrSummary('org')
      expect(res[0]).toMatchObject({ athleteId: 'a1', riskLevel: 'INSUFFICIENT_DATA', trend: 'stable' })
    })
  })

  describe('getWellnessTrend', () => {
    it('returns one point per day', async () => {
      const svc = new DashboardService(makePrisma() as any, calc() as any)
      const res = await svc.getWellnessTrend('org', 5)
      expect(res).toHaveLength(5)
      expect(res[0]).toHaveProperty('date')
    })
  })

  describe('getInjuryRiskDistribution', () => {
    it('counts HIGH/VERY_HIGH as at-risk', async () => {
      const calculations = calc({
        getTeamAcwrSummary: jest.fn().mockResolvedValue({
          athletes: [
            { athleteId: 'a1', name: 'A', acwr: 1.6, riskLevel: 'VERY_HIGH' },
            { athleteId: 'a2', name: 'B', acwr: 1.1, riskLevel: 'MODERATE' },
          ],
        }),
      })
      const svc = new DashboardService(makePrisma() as any, calculations as any)
      const res = await svc.getInjuryRiskDistribution('org')
      expect(res.totalAtRisk).toBe(1)
      expect(res.percentageAtRisk).toBe(50)
    })
  })
})
