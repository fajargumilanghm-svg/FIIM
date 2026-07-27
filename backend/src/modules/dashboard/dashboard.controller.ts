import { Controller, Get, Query, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { DashboardService } from './dashboard.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'
import { Request } from 'express'

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get dashboard overview statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard overview data' })
  async getOverview(@Query('orgId') orgId: string) {
    return this.dashboardService.getOverviewStats(orgId)
  }

  @Get('athlete-status')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get athlete status distribution' })
  async getAthleteStatusDistribution(@Query('orgId') orgId: string) {
    return this.dashboardService.getAthleteStatusDistribution(orgId)
  }

  @Get('team-overview')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get team overview with member details' })
  async getTeamOverview(@Query('orgId') orgId: string) {
    return this.dashboardService.getTeamOverview(orgId)
  }

  @Get('recent-activity')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get recent activity feed' })
  async getRecentActivity(
    @Query('orgId') orgId: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getRecentActivity(orgId, limit ? parseInt(limit) : 10)
  }

  @Get('acwr-summary')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get ACWR summary for all active athletes' })
  async getAcwrSummary(@Query('orgId') orgId: string) {
    return this.dashboardService.getAcwrSummary(orgId)
  }

  @Get('wellness-trend')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get wellness trend over last 7 days' })
  async getWellnessTrend(
    @Query('orgId') orgId: string,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getWellnessTrend(orgId, days ? parseInt(days) : 7)
  }

  @Get('injury-risk')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get injury risk distribution based on ACWR' })
  async getInjuryRisk(@Query('orgId') orgId: string) {
    return this.dashboardService.getInjuryRiskDistribution(orgId)
  }
}
