import { Injectable, NotFoundException, Optional } from '@nestjs/common'
import { ErasureStatus } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'

// Days a soft-deleted athlete is retained before the hard delete runs.
export const ERASURE_GRACE_DAYS = 30

@Injectable()
export class ComplianceService {
  constructor(
    private prisma: PrismaService,
    @Optional() private audit?: AuditService,
  ) {}

  /**
   * GDPR data portability: assemble everything held about an athlete into a
   * single structured object suitable for JSON/CSV download.
   */
  async exportAthleteData(orgId: string, athleteId: string) {
    const athlete = await this.prisma.athlete.findFirst({
      where: { id: athleteId, orgId },
      include: { position: { select: { name: true } }, sport: { select: { name: true } } },
    })
    if (!athlete) throw new NotFoundException('Athlete not found')

    const [wellness, sessionLoads, calculations, injuries, alerts] = await Promise.all([
      this.prisma.wellnessSurvey.findMany({ where: { athleteId, orgId } }),
      this.prisma.athleteSessionLoad.findMany({ where: { athleteId, orgId } }),
      this.prisma.athleteLoadCalculation.findMany({ where: { athleteId, orgId } }),
      this.prisma.injury.findMany({ where: { athleteId, orgId } }),
      this.prisma.alert.findMany({ where: { athleteId, orgId } }),
    ])

    await this.audit?.log({
      orgId,
      action: 'EXPORT',
      entityType: 'athlete',
      entityId: athleteId,
      description: 'GDPR data portability export',
      containsMedicalData: true,
    })

    return {
      exportedAt: new Date().toISOString(),
      subject: 'athlete',
      athlete,
      records: {
        wellnessSurveys: wellness,
        sessionLoads,
        loadCalculations: calculations,
        injuries,
        alerts,
      },
      counts: {
        wellnessSurveys: wellness.length,
        sessionLoads: sessionLoads.length,
        loadCalculations: calculations.length,
        injuries: injuries.length,
        alerts: alerts.length,
      },
    }
  }

  /**
   * GDPR right-to-erasure: soft-delete immediately and schedule a hard delete
   * after the grace period. Idempotent — an existing pending request is reused.
   */
  async requestErasure(orgId: string, athleteId: string, userId?: string, reason?: string) {
    const athlete = await this.prisma.athlete.findFirst({ where: { id: athleteId, orgId } })
    if (!athlete) throw new NotFoundException('Athlete not found')

    const existing = await this.prisma.erasureRequest.findFirst({
      where: { orgId, athleteId, status: ErasureStatus.PENDING },
    })
    if (existing) return existing

    // Soft-delete now; hard delete is deferred.
    if (!athlete.deletedAt) {
      await this.prisma.athlete.update({ where: { id: athleteId }, data: { deletedAt: new Date() } })
    }

    const scheduledFor = new Date()
    scheduledFor.setDate(scheduledFor.getDate() + ERASURE_GRACE_DAYS)

    const request = await this.prisma.erasureRequest.create({
      data: { orgId, athleteId, requestedBy: userId ?? null, reason: reason ?? null, scheduledFor },
    })
    await this.audit?.log({
      orgId,
      userId,
      action: 'DELETE',
      entityType: 'athlete',
      entityId: athleteId,
      description: `Erasure requested; hard delete scheduled for ${scheduledFor.toISOString().split('T')[0]}`,
      containsMedicalData: true,
    })
    return request
  }

  async cancelErasure(id: string, orgId: string, userId?: string) {
    const request = await this.prisma.erasureRequest.findFirst({ where: { id, orgId } })
    if (!request) throw new NotFoundException('Erasure request not found')
    if (request.status !== ErasureStatus.PENDING) {
      return request
    }
    const updated = await this.prisma.erasureRequest.update({
      where: { id },
      data: { status: ErasureStatus.CANCELLED },
    })
    // Restore the athlete from soft-delete.
    await this.prisma.athlete.update({ where: { id: request.athleteId }, data: { deletedAt: null } })
    await this.audit?.log({
      orgId,
      userId,
      action: 'UPDATE',
      entityType: 'athlete',
      entityId: request.athleteId,
      description: 'Erasure request cancelled; athlete restored',
    })
    return updated
  }

  async listErasureRequests(orgId: string) {
    return this.prisma.erasureRequest.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } })
  }

  /**
   * Execute hard deletes for any pending erasure whose grace period has ended.
   * Deleting the athlete cascades to their child records. Run periodically.
   */
  async processDueErasures(now: Date = new Date()) {
    const due = await this.prisma.erasureRequest.findMany({
      where: { status: ErasureStatus.PENDING, scheduledFor: { lte: now } },
    })

    let erased = 0
    for (const request of due) {
      await this.prisma.athlete
        .delete({ where: { id: request.athleteId } })
        .catch(() => undefined) // already gone → still mark complete
      await this.prisma.erasureRequest.update({
        where: { id: request.id },
        data: { status: ErasureStatus.COMPLETED, completedAt: now },
      })
      await this.audit?.log({
        orgId: request.orgId,
        action: 'DELETE',
        entityType: 'athlete',
        entityId: request.athleteId,
        description: 'Hard-deleted athlete per erasure schedule',
        containsMedicalData: true,
      })
      erased++
    }
    return { erased, due: due.length }
  }
}
