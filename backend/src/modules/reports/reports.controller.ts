import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { Role, ReportFormat } from '@prisma/client'
import { ReportsService } from './reports.service'
import { CreateScheduleDto, UpdateScheduleDto } from './dto/reports.dto'
import { Roles } from '../../common/decorators/roles.decorator'

const userIdOf = (req: Request): string | undefined => (req.user as any)?.id

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('team-summary')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Cross-module team summary report (JSON)' })
  async teamSummary(
    @Query('orgId') orgId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getTeamSummary(orgId, dateFrom, dateTo)
  }

  @Get('export/athletes.csv')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="fiim-athletes-acwr.csv"')
  @ApiOperation({ summary: 'Export current ACWR standing per athlete as CSV' })
  async exportAthletesCsv(@Query('orgId') orgId: string) {
    return this.reportsService.exportAthletesCsv(orgId)
  }

  // ---- Generated PDF reports ---------------------------------------------

  @Post('generate/team-summary')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.PERFORMANCE_DIRECTOR)
  @ApiOperation({ summary: 'Generate a team-summary report (PDF/CSV)' })
  async generateTeamSummary(
    @Query('orgId') orgId: string,
    @Req() req: Request,
    @Query('format') format?: string,
  ) {
    const fmt = format === 'csv' ? ReportFormat.CSV : ReportFormat.PDF
    return this.reportsService.generateTeamSummaryReport(orgId, userIdOf(req), fmt)
  }

  @Get('history')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'List generated reports' })
  async history(@Query('orgId') orgId: string) {
    return this.reportsService.listReports(orgId)
  }

  @Get(':id/download')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Download a generated report file' })
  async download(@Param('id') id: string, @Query('orgId') orgId: string, @Res() res: Response) {
    const { path, report } = await this.reportsService.getReportFile(id, orgId)
    const ext = report.format === ReportFormat.CSV ? 'csv' : 'pdf'
    const contentType = ext === 'csv' ? 'text/csv' : 'application/pdf'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="report-${id}.${ext}"`)
    res.sendFile(path)
  }

  // ---- Scheduled reports --------------------------------------------------

  @Get('schedules')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.PERFORMANCE_DIRECTOR)
  @ApiOperation({ summary: 'List scheduled reports' })
  async listSchedules(@Query('orgId') orgId: string) {
    return this.reportsService.listSchedules(orgId)
  }

  @Post('schedules')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.PERFORMANCE_DIRECTOR)
  @ApiOperation({ summary: 'Create a scheduled report' })
  async createSchedule(
    @Query('orgId') orgId: string,
    @Body() dto: CreateScheduleDto,
    @Req() req: Request,
  ) {
    return this.reportsService.createSchedule(orgId, dto, userIdOf(req))
  }

  @Patch('schedules/:id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.PERFORMANCE_DIRECTOR)
  @ApiOperation({ summary: 'Update a scheduled report' })
  async updateSchedule(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.reportsService.updateSchedule(id, orgId, dto)
  }

  @Delete('schedules/:id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.PERFORMANCE_DIRECTOR)
  @ApiOperation({ summary: 'Delete a scheduled report' })
  async removeSchedule(@Param('id') id: string, @Query('orgId') orgId: string) {
    return this.reportsService.removeSchedule(id, orgId)
  }
}
