import { ReportsService } from '../reports.service'

const prisma = { athlete: { count: jest.fn().mockResolvedValue(12) } }

const calc = {
  getTeamAcwrSummary: jest.fn().mockResolvedValue({
    atRiskCount: 1,
    atRiskPercentage: 8.3,
    riskDistribution: { HIGH: 1, MODERATE: 2 },
    athletes: [
      { name: 'A B', position: 'FW', acuteLoad: 100, chronicLoad: 90, acwr: 1.4, riskLevel: 'HIGH' },
      { name: 'C, D', position: 'MF', acuteLoad: 80, chronicLoad: 85, acwr: 0.9, riskLevel: 'LOW' },
    ],
  }),
}
const injuries = { getStats: jest.fn().mockResolvedValue({ currentlyOut: 2, totalDaysLost: 30, bySeverity: { MINOR: 1 } }) }
const wellness = { getTeamAverage: jest.fn().mockResolvedValue([{ wellnessScore: 7.2 }]) }

describe('ReportsService', () => {
  describe('getTeamSummary', () => {
    it('combines ACWR, injuries, and wellness into one report', async () => {
      const svc = new ReportsService(prisma as any, calc as any, injuries as any, wellness as any)
      const res = await svc.getTeamSummary('org', '2026-07-01', '2026-07-31')
      expect(res.roster.total).toBe(12)
      expect(res.injuryRisk.atRiskCount).toBe(1)
      expect(res.injuries.currentlyOut).toBe(2)
      expect(res.wellness.latestTeamScore).toBe(7.2)
      // Only HIGH/VERY_HIGH athletes are surfaced
      expect(res.atRiskAthletes).toHaveLength(1)
      expect(res.atRiskAthletes[0].name).toBe('A B')
    })

    it('handles empty wellness data', async () => {
      const wellnessEmpty = { getTeamAverage: jest.fn().mockResolvedValue([]) }
      const svc = new ReportsService(prisma as any, calc as any, injuries as any, wellnessEmpty as any)
      const res = await svc.getTeamSummary('org')
      expect(res.wellness.latestTeamScore).toBeNull()
    })
  })

  describe('exportAthletesCsv', () => {
    it('produces a header + one row per athlete, quoting commas', async () => {
      const audit = { log: jest.fn() }
      const svc = new ReportsService(prisma as any, calc as any, injuries as any, wellness as any, audit as any)
      const csv = await svc.exportAthletesCsv('org')
      const lines = csv.split('\n')
      expect(lines[0]).toBe('Athlete,Position,Acute Load,Chronic Load,ACWR,Risk Level')
      expect(lines).toHaveLength(3)
      expect(lines[2]).toContain('"C, D"') // comma-containing name quoted
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'EXPORT' }))
    })
  })
})
