import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { Role } from '@prisma/client'
import { InjuriesService } from './injuries.service'
import { InjuryMedicalService } from './injury-medical.service'
import { CreateInjuryDto, UpdateInjuryDto, InjuryQueryDto } from './dto/injuries.dto'
import {
  AdvanceRtpDto,
  CreateClearanceDto,
  CreateDiagnosisDto,
  CreateTreatmentNoteDto,
  UpdateRtpStageDto,
} from './dto/medical.dto'
import { Roles } from '../../common/decorators/roles.decorator'

const roleOf = (req: Request): Role | undefined => (req.user as any)?.role
const userIdOf = (req: Request): string | undefined => (req.user as any)?.id

@ApiTags('Injuries')
@ApiBearerAuth()
@Controller('injuries')
export class InjuriesController {
  constructor(
    private injuriesService: InjuriesService,
    private medical: InjuryMedicalService,
  ) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'List injuries' })
  async findAll(@Query('orgId') orgId: string, @Query() query: InjuryQueryDto) {
    return this.injuriesService.findAll(orgId, query)
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Injury counts and days-lost summary' })
  async getStats(@Query('orgId') orgId: string) {
    return this.injuriesService.getStats(orgId)
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get injury by ID' })
  async findOne(@Param('id') id: string, @Query('orgId') orgId: string) {
    return this.injuriesService.findOne(id, orgId)
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Report a new injury' })
  async create(
    @Body() data: CreateInjuryDto,
    @Query('orgId') orgId: string,
    @Req() req: Request,
  ) {
    return this.injuriesService.create(orgId, data, (req.user as any)?.id)
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Update an injury / progress return-to-play' })
  async update(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() data: UpdateInjuryDto,
  ) {
    return this.injuriesService.update(id, orgId, data)
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Delete an injury' })
  async remove(@Param('id') id: string, @Query('orgId') orgId: string) {
    return this.injuriesService.remove(id, orgId)
  }

  // ---- Role-segregated case detail ---------------------------------------

  @Get(':id/case')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Case detail (clinical data segregated by role)' })
  async getCase(@Param('id') id: string, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.medical.getCaseDetail(id, orgId, roleOf(req))
  }

  // ---- Return-to-play ----------------------------------------------------

  @Get(':id/rtp')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get return-to-play stage progress' })
  async getRtp(@Param('id') id: string, @Query('orgId') orgId: string) {
    return this.medical.getRtpProgress(id, orgId)
  }

  @Post(':id/rtp/start')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Start the return-to-play pathway' })
  async startRtp(@Param('id') id: string, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.medical.initRtp(id, orgId, userIdOf(req))
  }

  @Patch(':id/rtp/stage')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Update current RTP stage criteria/notes' })
  async updateRtpStage(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() dto: UpdateRtpStageDto,
  ) {
    return this.medical.updateCurrentStage(id, orgId, dto)
  }

  @Post(':id/rtp/advance')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Advance to the next RTP stage (gated)' })
  async advanceRtp(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() dto: AdvanceRtpDto,
    @Req() req: Request,
  ) {
    return this.medical.advanceStage(id, orgId, dto, userIdOf(req))
  }

  // ---- Clinical: diagnoses, notes, clearance (medical staff only) ---------

  @Get(':id/diagnoses')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'List diagnoses (clinical)' })
  async listDiagnoses(@Param('id') id: string, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.medical.listDiagnoses(id, orgId, roleOf(req))
  }

  @Post(':id/diagnoses')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Add a diagnosis (clinical)' })
  async addDiagnosis(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() dto: CreateDiagnosisDto,
    @Req() req: Request,
  ) {
    return this.medical.addDiagnosis(id, orgId, dto, roleOf(req), userIdOf(req))
  }

  @Delete('diagnoses/:diagnosisId')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Remove a diagnosis (clinical)' })
  async removeDiagnosis(
    @Param('diagnosisId') diagnosisId: string,
    @Query('orgId') orgId: string,
    @Req() req: Request,
  ) {
    return this.medical.removeDiagnosis(diagnosisId, orgId, roleOf(req), userIdOf(req))
  }

  @Get(':id/notes')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'List treatment notes (clinical)' })
  async listNotes(@Param('id') id: string, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.medical.listTreatmentNotes(id, orgId, roleOf(req))
  }

  @Post(':id/notes')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Add a treatment note (clinical)' })
  async addNote(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() dto: CreateTreatmentNoteDto,
    @Req() req: Request,
  ) {
    return this.medical.addTreatmentNote(id, orgId, dto, roleOf(req), userIdOf(req))
  }

  @Get(':id/clearances')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'List medical clearances (clinical)' })
  async listClearances(@Param('id') id: string, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.medical.listClearances(id, orgId, roleOf(req))
  }

  @Post(':id/clearances')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Record a medical clearance (clinician only)' })
  async addClearance(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() dto: CreateClearanceDto,
    @Req() req: Request,
  ) {
    return this.medical.createClearance(id, orgId, dto, roleOf(req), userIdOf(req))
  }
}
