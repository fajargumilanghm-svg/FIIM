import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { TrainingLoadService } from './training-load.service'
import { CreateTrainingSessionDto, UpdateTrainingSessionDto, CreateAthleteSessionLoadDto } from './dto/training-load.dto'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Training Load')
@ApiBearerAuth()
@Controller('training')
export class TrainingLoadController {
  constructor(private trainingLoadService: TrainingLoadService) {}

  @Get('sessions')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'List training sessions' })
  async findAllSessions(
    @Query('orgId') orgId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.trainingLoadService.findAllSessions(orgId, { dateFrom, dateTo, teamId })
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get training session by ID' })
  async findSessionById(@Param('id') id: string, @Query('orgId') orgId: string) {
    return this.trainingLoadService.findSessionById(id, orgId)
  }

  @Post('sessions')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH)
  @ApiOperation({ summary: 'Create training session' })
  async createSession(@Body() data: CreateTrainingSessionDto, @Query('orgId') orgId: string) {
    return this.trainingLoadService.createSession(orgId, data)
  }

  @Patch('sessions/:id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH)
  @ApiOperation({ summary: 'Update training session' })
  async updateSession(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() data: UpdateTrainingSessionDto,
  ) {
    return this.trainingLoadService.updateSession(id, orgId, data)
  }

  @Delete('sessions/:id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH)
  @ApiOperation({ summary: 'Delete training session' })
  async deleteSession(@Param('id') id: string, @Query('orgId') orgId: string) {
    return this.trainingLoadService.deleteSession(id, orgId)
  }

  @Post('sessions/:id/athlete-load')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Add athlete load to session' })
  async addAthleteLoad(
    @Param('id') sessionId: string,
    @Query('orgId') orgId: string,
    @Body() data: CreateAthleteSessionLoadDto,
  ) {
    return this.trainingLoadService.addAthleteLoad(sessionId, orgId, data)
  }

  @Get('athlete-load/:athleteId')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get athlete training load history' })
  async getAthleteLoadHistory(
    @Param('athleteId') athleteId: string,
    @Query('orgId') orgId: string,
    @Query('days') days?: string,
  ) {
    return this.trainingLoadService.getAthleteLoadHistory(athleteId, orgId, days ? parseInt(days) : 30)
  }
}
