import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { WellnessService } from './wellness.service'
import { CreateWellnessSurveyDto, UpdateWellnessSurveyDto } from './dto/wellness.dto'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'
import { Request } from 'express'

@ApiTags('Wellness')
@ApiBearerAuth()
@Controller('wellness')
export class WellnessController {
  constructor(private wellnessService: WellnessService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'List wellness surveys' })
  async findAll(
    @Query('orgId') orgId: string,
    @Query('athleteId') athleteId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.wellnessService.findAll(orgId, { athleteId, dateFrom, dateTo })
  }

  @Get('trend/:athleteId')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get athlete wellness trend' })
  async getAthleteTrend(
    @Param('athleteId') athleteId: string,
    @Query('orgId') orgId: string,
    @Query('days') days?: string,
  ) {
    return this.wellnessService.getAthleteTrend(athleteId, orgId, days ? parseInt(days) : 14)
  }

  @Get('team-average')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get team average wellness by date' })
  async getTeamAverage(
    @Query('orgId') orgId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.wellnessService.getTeamAverage(orgId, dateFrom, dateTo)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wellness survey by ID' })
  async findOne(@Param('id') id: string, @Query('orgId') orgId: string) {
    return this.wellnessService.findOne(id, orgId)
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ATHLETE)
  @ApiOperation({ summary: 'Create wellness survey' })
  async create(
    @Body() data: CreateWellnessSurveyDto,
    @Query('orgId') orgId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.sub
    return this.wellnessService.create(orgId, data, userId)
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Update wellness survey' })
  async update(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() data: UpdateWellnessSurveyDto,
  ) {
    return this.wellnessService.update(id, orgId, data)
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH)
  @ApiOperation({ summary: 'Delete wellness survey' })
  async remove(@Param('id') id: string, @Query('orgId') orgId: string) {
    return this.wellnessService.remove(id, orgId)
  }
}
