import { Injectable, NotFoundException, Optional } from '@nestjs/common'
import { AlertStatus, InjuryStatus, Role } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { UpdateOrganizationDto } from './dto/admin.dto'

const ALL_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ORGANIZATION_ADMIN,
  Role.COACH,
  Role.ATHLETE,
  Role.MEDICAL_STAFF,
  Role.PERFORMANCE_DIRECTOR,
  Role.PARENT_GUARDIAN,
  Role.ANALYST,
]

const ACTIVE_INJURY_STATUSES: InjuryStatus[] = [
  InjuryStatus.OPEN,
  InjuryStatus.RECOVERING,
  InjuryStatus.RETURN_TO_PLAY,
]

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    @Optional() private audit?: AuditService,
  ) {}

  /** System control-panel snapshot: who and what lives in this organization. */
  async getOverview(orgId: string) {
    const [
      usersByRole,
      athletesByStatus,
      teams,
      sports,
      injuriesOut,
      openAlerts,
      wellnessCount,
      sessionCount,
    ] = await Promise.all([
      this.prisma.userOrganization.groupBy({
        by: ['role'],
        where: { orgId, leftAt: null },
        _count: { role: true },
      }),
      this.prisma.athlete.groupBy({
        by: ['status'],
        where: { orgId, deletedAt: null },
        _count: { status: true },
      }),
      this.prisma.team.count({ where: { orgId, deletedAt: null } }),
      this.prisma.sport.count({ where: { orgId } }),
      this.prisma.injury.count({
        where: { orgId, deletedAt: null, status: { in: ACTIVE_INJURY_STATUSES } },
      }),
      this.prisma.alert.count({ where: { orgId, status: AlertStatus.OPEN } }),
      this.prisma.wellnessSurvey.count({ where: { orgId } }),
      this.prisma.trainingSession.count({ where: { orgId, deletedAt: null } }),
    ])

    const roleCounts = Object.fromEntries(ALL_ROLES.map((r) => [r, 0])) as Record<Role, number>
    for (const row of usersByRole) roleCounts[row.role] = row._count.role
    const totalUsers = Object.values(roleCounts).reduce((a, b) => a + b, 0)

    const athleteStatusCounts: Record<string, number> = {}
    let totalAthletes = 0
    for (const row of athletesByStatus) {
      athleteStatusCounts[row.status] = row._count.status
      totalAthletes += row._count.status
    }

    return {
      users: { total: totalUsers, byRole: roleCounts },
      athletes: { total: totalAthletes, byStatus: athleteStatusCounts },
      teams,
      sports,
      injuriesCurrentlyOut: injuriesOut,
      openAlerts,
      wellnessSurveys: wellnessCount,
      trainingSessions: sessionCount,
    }
  }

  async getOrganization(orgId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } })
    if (!org) throw new NotFoundException('Organization not found')
    return org
  }

  async updateOrganization(orgId: string, data: UpdateOrganizationDto, userId?: string) {
    const existing = await this.prisma.organization.findUnique({ where: { id: orgId } })
    if (!existing) throw new NotFoundException('Organization not found')

    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: { ...data, updatedAt: new Date() },
    })

    await this.audit?.log({
      orgId,
      userId,
      action: 'CONFIG_CHANGED',
      entityType: 'organization',
      entityId: orgId,
      description: 'Updated organization settings',
      newValues: data as any,
    })

    return org
  }
}
