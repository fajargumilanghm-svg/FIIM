import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CalculationsService } from './calculations.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Calculations')
@ApiBearerAuth()
@Controller('calculations')
export class CalculationsController {
  constructor(private calculationsService: CalculationsService) {}

  @Get('config')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get algorithm configuration' })
  async getConfig(@Query('orgId') orgId: string) {
    return this.calculationsService.getAlgorithmConfig(orgId)
  }

  @Post('config')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Update algorithm configuration' })
  async updateConfig(
    @Query('orgId') orgId: string,
    @Body() data: any,
  ) {
    return this.calculationsService.updateAlgorithmConfig(orgId, data)
  }

  @Get('acwr/:athleteId')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Calculate ACWR for specific athlete' })
  async calculateAthleteAcwr(
    @Param('athleteId') athleteId: string,
    @Query('orgId') orgId: string,
    @Query('date') date?: string,
  ) {
    return this.calculationsService.calculateAthleteAcwr(
      athleteId,
      orgId,
      date ? new Date(date) : undefined,
    )
  }

  @Post('acwr/all')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH)
  @ApiOperation({ summary: 'Calculate ACWR for all active athletes' })
  async calculateAllAthletes(
    @Query('orgId') orgId: string,
    @Query('date') date?: string,
  ) {
    return this.calculationsService.calculateAllAthletes(
      orgId,
      date ? new Date(date) : undefined,
    )
  }

  @Get('acwr-history/:athleteId')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get athlete ACWR history' })
  async getAthleteAcwrHistory(
    @Param('athleteId') athleteId: string,
    @Query('orgId') orgId: string,
    @Query('days') days?: string,
  ) {
    return this.calculationsService.getAthleteAcwrHistory(
      athleteId,
      orgId,
      days ? parseInt(days) : 30,
    )
  }

  @Get('team-summary')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get team ACWR summary' })
  async getTeamSummary(
    @Query('orgId') orgId: string,
    @Query('date') date?: string,
  ) {
    return this.calculationsService.getTeamAcwrSummary(
      orgId,
      date ? new Date(date) : undefined,
    )
  }
}
