import { Controller, Get, Query, Header } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { ReportsService } from './reports.service'
import { Roles } from '../../common/decorators/roles.decorator'

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
}
