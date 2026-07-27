import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CalculationsService } from '../calculations/calculations.service'
import { InjuriesService } from '../injuries/injuries.service'
import { WellnessService } from '../wellness/wellness.service'

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private calculations: CalculationsService,
    private injuries: InjuriesService,
    private wellness: WellnessService,
  ) {}

  /**
   * Cross-module team snapshot: ACWR risk distribution, injury burden, and
   * average wellness — the numbers a performance director wants weekly.
   */
  async getTeamSummary(orgId: string, dateFrom?: string, dateTo?: string) {
    const [acwr, injuryStats, wellnessAvg, athleteCount] = await Promise.all([
      this.calculations.getTeamAcwrSummary(orgId),
      this.injuries.getStats(orgId),
      this.wellness.getTeamAverage(orgId, dateFrom, dateTo),
      this.prisma.athlete.count({ where: { orgId, deletedAt: null } }),
    ])

    const latestWellness = wellnessAvg.length ? wellnessAvg[wellnessAvg.length - 1] : null

    return {
      generatedAt: new Date().toISOString(),
      period: { from: dateFrom ?? null, to: dateTo ?? null },
      roster: { total: athleteCount },
      injuryRisk: {
        atRiskCount: acwr.atRiskCount,
        atRiskPercentage: acwr.atRiskPercentage,
        riskDistribution: acwr.riskDistribution,
      },
      injuries: {
        currentlyOut: injuryStats.currentlyOut,
        totalDaysLost: injuryStats.totalDaysLost,
        bySeverity: injuryStats.bySeverity,
      },
      wellness: {
        latestTeamScore: latestWellness?.wellnessScore ?? null,
        dataPoints: wellnessAvg.length,
      },
      atRiskAthletes: acwr.athletes
        .filter((a: any) => a.riskLevel === 'HIGH' || a.riskLevel === 'VERY_HIGH')
        .map((a: any) => ({
          name: a.name,
          position: a.position,
          acwr: a.acwr,
          riskLevel: a.riskLevel,
        })),
    }
  }

  /**
   * CSV export of the current ACWR standing per athlete. Returns a raw CSV
   * string; the controller sets the download headers.
   */
  async exportAthletesCsv(orgId: string): Promise<string> {
    const summary = await this.calculations.getTeamAcwrSummary(orgId)
    const header = ['Athlete', 'Position', 'Acute Load', 'Chronic Load', 'ACWR', 'Risk Level']

    const rows = summary.athletes.map((a: any) =>
      [a.name, a.position ?? '', a.acuteLoad ?? '', a.chronicLoad ?? '', a.acwr ?? '', a.riskLevel ?? '']
        .map((v) => csvCell(v))
        .join(','),
    )

    return [header.map(csvCell).join(','), ...rows].join('\n')
  }
}

/** Quote and escape a value for safe CSV output. */
export function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}
