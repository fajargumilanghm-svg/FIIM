import { Injectable, NotFoundException, Optional } from '@nestjs/common'
import { AlertSeverity, AlertStatus, AlertType, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CalculationsService } from '../calculations/calculations.service'
import { AuditService } from '../audit/audit.service'
import { AlertQueryDto } from './dto/alerts.dto'

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private calculations: CalculationsService,
    @Optional() private audit?: AuditService,
  ) {}

  async findAll(orgId: string, query: AlertQueryDto = {}) {
    const where: Prisma.AlertWhereInput = { orgId }
    if (query.status) where.status = query.status
    if (query.severity) where.severity = query.severity
    if (query.type) where.type = query.type
    if (query.athleteId) where.athleteId = query.athleteId

    return this.prisma.alert.findMany({
      where,
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: { select: { name: true } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { severity: 'desc' }, { triggeredOn: 'desc' }],
    })
  }

  async getStats(orgId: string) {
    const [open, acknowledged, resolved, critical, warning] = await Promise.all([
      this.prisma.alert.count({ where: { orgId, status: AlertStatus.OPEN } }),
      this.prisma.alert.count({ where: { orgId, status: AlertStatus.ACKNOWLEDGED } }),
      this.prisma.alert.count({ where: { orgId, status: AlertStatus.RESOLVED } }),
      this.prisma.alert.count({
        where: { orgId, severity: AlertSeverity.CRITICAL, status: { not: AlertStatus.RESOLVED } },
      }),
      this.prisma.alert.count({
        where: { orgId, severity: AlertSeverity.WARNING, status: { not: AlertStatus.RESOLVED } },
      }),
    ])

    return { open, acknowledged, resolved, active: open + acknowledged, critical, warning }
  }

  /**
   * Scan today's ACWR calculations for an org and raise alerts for athletes
   * whose load lands in the HIGH or VERY_HIGH danger zone. Idempotent: the
   * unique (athleteId, type, triggeredOn) constraint means re-running the same
   * day updates the existing alert rather than duplicating it.
   */
  async generateForOrg(orgId: string, targetDate?: Date) {
    const calcDate = targetDate || new Date()
    const dateOnly = new Date(calcDate.toISOString().split('T')[0])

    // Ensure today's calculations are up to date before scanning them.
    await this.calculations.calculateAllAthletes(orgId, calcDate)

    const calculations = await this.prisma.athleteLoadCalculation.findMany({
      where: { orgId, calcDate: dateOnly },
      include: { athlete: { select: { firstName: true, lastName: true } } },
    })

    const config = await this.calculations.getAlgorithmConfig(orgId)

    let created = 0
    let updated = 0

    for (const calc of calculations) {
      const spec = this.classifyAlert(calc.riskLevel, calc.acwr)
      if (!spec) continue

      const name = `${calc.athlete?.firstName ?? ''} ${calc.athlete?.lastName ?? ''}`.trim()
      const threshold =
        spec.type === AlertType.ACWR_VERY_HIGH ? config.highThreshold : config.moderateThreshold

      const existing = await this.prisma.alert.findUnique({
        where: {
          athleteId_type_triggeredOn: {
            athleteId: calc.athleteId,
            type: spec.type,
            triggeredOn: dateOnly,
          },
        },
      })

      const data = {
        orgId,
        athleteId: calc.athleteId,
        type: spec.type,
        severity: spec.severity,
        title: spec.title,
        message: `${name || 'Athlete'} has an ACWR of ${calc.acwr} (${calc.riskLevel}). ${spec.advice}`,
        metricValue: calc.acwr,
        threshold,
        riskLevel: calc.riskLevel,
        triggeredOn: dateOnly,
      }

      if (existing) {
        // Only refresh still-open alerts; don't reopen ones a coach resolved.
        if (existing.status === AlertStatus.OPEN) {
          await this.prisma.alert.update({ where: { id: existing.id }, data })
          updated++
        }
      } else {
        const alert = await this.prisma.alert.create({ data })
        created++
        await this.audit?.log({
          orgId,
          action: 'ALERT_TRIGGERED',
          entityType: 'alert',
          entityId: alert.id,
          description: `${spec.title} for athlete ${calc.athleteId} (ACWR ${calc.acwr})`,
        })
      }
    }

    return { date: dateOnly.toISOString().split('T')[0], scanned: calculations.length, created, updated }
  }

  private classifyAlert(
    riskLevel: string | null,
    acwr: number | null,
  ): { type: AlertType; severity: AlertSeverity; title: string; advice: string } | null {
    if (!riskLevel || acwr == null) return null

    if (riskLevel === 'VERY_HIGH') {
      return {
        type: AlertType.ACWR_VERY_HIGH,
        severity: AlertSeverity.CRITICAL,
        title: 'Extreme injury-risk load (ACWR ≥ 1.5)',
        advice: 'Consider reducing load and reviewing recovery immediately.',
      }
    }
    if (riskLevel === 'HIGH') {
      return {
        type: AlertType.ACWR_HIGH,
        severity: AlertSeverity.WARNING,
        title: 'Elevated injury-risk load (ACWR 1.3–1.5)',
        advice: 'Monitor closely and avoid further sharp load increases.',
      }
    }
    return null
  }

  async acknowledge(id: string, orgId: string, userId?: string) {
    await this.ensureExists(id, orgId)
    return this.prisma.alert.update({
      where: { id },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId ?? null,
      },
    })
  }

  async resolve(id: string, orgId: string, note?: string, userId?: string) {
    await this.ensureExists(id, orgId)
    return this.prisma.alert.update({
      where: { id },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: userId ?? null,
        resolutionNote: note ?? null,
      },
    })
  }

  private async ensureExists(id: string, orgId: string) {
    const alert = await this.prisma.alert.findFirst({ where: { id, orgId } })
    if (!alert) throw new NotFoundException('Alert not found')
    return alert
  }
}
