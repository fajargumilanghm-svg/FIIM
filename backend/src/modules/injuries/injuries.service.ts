import { Injectable, NotFoundException } from '@nestjs/common'
import { InjurySeverity, InjuryStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateInjuryDto, InjuryQueryDto, UpdateInjuryDto } from './dto/injuries.dto'

// Statuses that mean the athlete is currently unavailable.
const ACTIVE_INJURY_STATUSES: InjuryStatus[] = [
  InjuryStatus.OPEN,
  InjuryStatus.RECOVERING,
  InjuryStatus.RETURN_TO_PLAY,
]

@Injectable()
export class InjuriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Classify severity from days lost, per the OSICS-style bands used in the
   * schema comments: MINOR < 7, MODERATE 7–28, SEVERE > 28.
   */
  static classifySeverity(daysLost: number): InjurySeverity {
    if (daysLost > 28) return InjurySeverity.SEVERE
    if (daysLost >= 7) return InjurySeverity.MODERATE
    return InjurySeverity.MINOR
  }

  async findAll(orgId: string, query: InjuryQueryDto = {}) {
    const where: Prisma.InjuryWhereInput = { orgId, deletedAt: null }
    if (query.status) where.status = query.status
    if (query.severity) where.severity = query.severity
    if (query.athleteId) where.athleteId = query.athleteId

    return this.prisma.injury.findMany({
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
      orderBy: [{ status: 'asc' }, { onsetDate: 'desc' }],
    })
  }

  async findOne(id: string, orgId: string) {
    const injury = await this.prisma.injury.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
    })
    if (!injury) throw new NotFoundException('Injury not found')
    return injury
  }

  async create(orgId: string, data: CreateInjuryDto, userId?: string) {
    const injury = await this.prisma.injury.create({
      data: {
        orgId,
        athleteId: data.athleteId,
        bodyPart: data.bodyPart,
        injuryType: data.injuryType,
        mechanism: data.mechanism ?? 'UNKNOWN',
        severity: data.severity ?? InjurySeverity.MINOR,
        status: InjuryStatus.OPEN,
        description: data.description,
        onsetDate: new Date(data.onsetDate),
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
        reportedBy: userId ?? null,
      },
      include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
    })

    // A new open injury takes the athlete out of availability.
    await this.prisma.athlete.update({
      where: { id: data.athleteId },
      data: { status: 'INJURED' },
    })

    return injury
  }

  async update(id: string, orgId: string, data: UpdateInjuryDto) {
    const existing = await this.prisma.injury.findFirst({ where: { id, orgId, deletedAt: null } })
    if (!existing) throw new NotFoundException('Injury not found')

    const actualReturnDate = data.actualReturnDate
      ? new Date(data.actualReturnDate)
      : existing.actualReturnDate

    // When resolving, stamp the return date and derive days-lost/severity if not given.
    let daysLost = data.daysLost ?? existing.daysLost
    let severity = data.severity ?? existing.severity
    if (data.status === InjuryStatus.RESOLVED) {
      const end = actualReturnDate ?? new Date()
      if (data.daysLost == null) {
        daysLost = Math.max(
          0,
          Math.round((end.getTime() - existing.onsetDate.getTime()) / 86_400_000),
        )
      }
      if (data.severity == null) {
        severity = InjuriesService.classifySeverity(daysLost)
      }
    }

    const updated = await this.prisma.injury.update({
      where: { id },
      data: {
        bodyPart: data.bodyPart,
        injuryType: data.injuryType,
        mechanism: data.mechanism,
        severity,
        status: data.status,
        description: data.description,
        expectedReturnDate: data.expectedReturnDate
          ? new Date(data.expectedReturnDate)
          : undefined,
        actualReturnDate:
          data.status === InjuryStatus.RESOLVED ? (actualReturnDate ?? new Date()) : actualReturnDate,
        daysLost,
        updatedAt: new Date(),
      },
      include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
    })

    await this.syncAthleteAvailability(existing.athleteId, orgId)
    return updated
  }

  async remove(id: string, orgId: string) {
    const existing = await this.prisma.injury.findFirst({ where: { id, orgId, deletedAt: null } })
    if (!existing) throw new NotFoundException('Injury not found')

    await this.prisma.injury.update({ where: { id }, data: { deletedAt: new Date() } })
    await this.syncAthleteAvailability(existing.athleteId, orgId)
    return { message: 'Injury deleted' }
  }

  /**
   * Keep the athlete's status in sync with their open injuries: if none remain
   * active, and they were flagged INJURED, return them to ACTIVE.
   */
  private async syncAthleteAvailability(athleteId: string, orgId: string) {
    const activeInjuries = await this.prisma.injury.count({
      where: { athleteId, orgId, deletedAt: null, status: { in: ACTIVE_INJURY_STATUSES } },
    })
    if (activeInjuries === 0) {
      const athlete = await this.prisma.athlete.findFirst({ where: { id: athleteId, orgId } })
      if (athlete?.status === 'INJURED') {
        await this.prisma.athlete.update({ where: { id: athleteId }, data: { status: 'ACTIVE' } })
      }
    }
  }

  async getStats(orgId: string) {
    const injuries = await this.prisma.injury.findMany({
      where: { orgId, deletedAt: null },
      select: { status: true, severity: true, daysLost: true },
    })

    const byStatus = { OPEN: 0, RECOVERING: 0, RETURN_TO_PLAY: 0, RESOLVED: 0 }
    const bySeverity = { MINOR: 0, MODERATE: 0, SEVERE: 0 }
    let totalDaysLost = 0

    for (const inj of injuries) {
      byStatus[inj.status] = (byStatus[inj.status] ?? 0) + 1
      bySeverity[inj.severity] = (bySeverity[inj.severity] ?? 0) + 1
      totalDaysLost += inj.daysLost
    }

    const currentlyOut = byStatus.OPEN + byStatus.RECOVERING + byStatus.RETURN_TO_PLAY

    return {
      total: injuries.length,
      currentlyOut,
      totalDaysLost,
      byStatus,
      bySeverity,
    }
  }
}
