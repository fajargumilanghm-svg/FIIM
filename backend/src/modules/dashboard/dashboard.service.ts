import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CalculationsService } from '../calculations/calculations.service'
import { Role, AthleteStatus } from '@prisma/client'

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private calculationsService: CalculationsService,
  ) {}

  async getOverviewStats(orgId: string) {
    const [
      totalAthletes,
      activeAthletes,
      injuredAthletes,
      returningAthletes,
      totalUsers,
      activeCoaches,
      totalTeams,
      totalSports,
    ] = await Promise.all([
      this.prisma.athlete.count({ where: { orgId, deletedAt: null } }),
      this.prisma.athlete.count({ where: { orgId, status: AthleteStatus.ACTIVE, deletedAt: null } }),
      this.prisma.athlete.count({ where: { orgId, status: AthleteStatus.INJURED, deletedAt: null } }),
      this.prisma.athlete.count({ where: { orgId, status: AthleteStatus.RETURNING_TO_PLAY, deletedAt: null } }),
      this.prisma.userOrganization.count({ where: { orgId, leftAt: null } }),
      this.prisma.userOrganization.count({ where: { orgId, role: Role.COACH, leftAt: null } }),
      this.prisma.team.count({ where: { orgId, deletedAt: null } }),
      this.prisma.sport.count({ where: { orgId, deletedAt: null } }),
    ])

    return {
      athletes: {
        total: totalAthletes,
        active: activeAthletes,
        injured: injuredAthletes,
        returning: returningAthletes,
        healthy: activeAthletes - injuredAthletes,
      },
      staff: {
        total: totalUsers,
        coaches: activeCoaches,
      },
      teams: totalTeams,
      sports: totalSports,
    }
  }

  async getAthleteStatusDistribution(orgId: string) {
    const distribution = await this.prisma.athlete.groupBy({
      by: ['status'],
      where: { orgId, deletedAt: null },
      _count: {
        status: true,
      },
    })

    return distribution.map((item) => ({
      status: item.status,
      count: item._count.status,
    }))
  }

  async getTeamOverview(orgId: string) {
    const teams = await this.prisma.team.findMany({
      where: { orgId, deletedAt: null },
      include: {
        sport: { select: { id: true, name: true } },
        members: {
          include: {
            athlete: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                status: true,
                jerseyNumber: true,
                position: { select: { name: true, abbreviation: true } },
              },
            },
          },
        },
      },
    })

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      category: team.category,
      sport: team.sport,
      totalMembers: team.members.length,
      activeMembers: team.members.filter((m) => m.athlete.status === 'ACTIVE').length,
      injuredMembers: team.members.filter((m) => m.athlete.status === 'INJURED').length,
      members: team.members.map((m) => ({
        id: m.athlete.id,
        name: `${m.athlete.firstName} ${m.athlete.lastName}`,
        jerseyNumber: m.athlete.jerseyNumber,
        position: m.athlete.position,
        status: m.athlete.status,
        role: m.role,
      })),
    }))
  }

  async getRecentActivity(orgId: string, limit = 10) {
    const [recentAthletes, recentAuditLogs] = await Promise.all([
      this.prisma.athlete.findMany({
        where: { orgId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          updatedAt: true,
        },
      }),
      this.prisma.auditLog.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ])

    return {
      recentAthletes: recentAthletes.map((a) => ({
        id: a.id,
        name: `${a.firstName} ${a.lastName}`,
        status: a.status,
        updatedAt: a.updatedAt,
      })),
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        description: log.description,
        userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        createdAt: log.createdAt,
      })),
    }
  }

  // Real ACWR data using Calculation Engine (Sprint 4)
  async getAcwrSummary(orgId: string) {
    try {
      const summary = await this.calculationsService.getTeamAcwrSummary(orgId)
      return summary.athletes.map((athlete: any) => ({
        athleteId: athlete.athleteId,
        name: athlete.name,
        position: athlete.position,
        acwr: athlete.acwr,
        acuteLoad: athlete.acuteLoad || 0,
        chronicLoad: athlete.chronicLoad || 0,
        riskLevel: athlete.riskLevel,
        riskColor: athlete.riskColor,
        trend: athlete.acwr > 1.3 ? 'increasing' : 'stable',
      }))
    } catch (error) {
      // Fallback if no calculation data exists
      const athletes = await this.prisma.athlete.findMany({
        where: { orgId, deletedAt: null, status: AthleteStatus.ACTIVE },
        select: { id: true, firstName: true, lastName: true, position: { select: { name: true } } },
      })

      return athletes.map((athlete) => ({
        athleteId: athlete.id,
        name: `${athlete.firstName} ${athlete.lastName}`,
        position: athlete.position?.name,
        acwr: 0,
        acuteLoad: 0,
        chronicLoad: 0,
        riskLevel: 'INSUFFICIENT_DATA',
        riskColor: '#6b7280',
        trend: 'stable',
      }))
    }
  }

  // Placeholder for wellness trend data
  async getWellnessTrend(orgId: string, days = 7) {
    const dates: { date: string; avgScore: number; responseCount: number }[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push({
        date: date.toISOString().split('T')[0],
        avgScore: 6.5 + Math.random() * 2.5, // Random between 6.5 and 9.0
        responseCount: Math.round(5 + Math.random() * 10),
      })
    }

    return dates
  }

  // Placeholder for injury risk distribution
  async getInjuryRiskDistribution(orgId: string) {
    const acwrData = await this.getAcwrSummary(orgId)
    
    const distribution = {
      LOW: acwrData.filter((a: any) => a.riskLevel === 'LOW').length,
      MODERATE: acwrData.filter((a: any) => a.riskLevel === 'MODERATE').length,
      HIGH: acwrData.filter((a: any) => a.riskLevel === 'HIGH').length,
      VERY_HIGH: acwrData.filter((a: any) => a.riskLevel === 'VERY_HIGH').length,
    }

    return {
      distribution,
      totalAtRisk: distribution.HIGH + distribution.VERY_HIGH,
      percentageAtRisk: parseFloat(((distribution.HIGH + distribution.VERY_HIGH) / acwrData.length * 100).toFixed(1)),
      athletes: acwrData,
    }
  }
}
