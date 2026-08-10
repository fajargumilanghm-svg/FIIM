import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { Role } from '@prisma/client'
import { AlertsService } from './alerts.service'
import { AlertQueryDto, ResolveAlertDto } from './dto/alerts.dto'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'List alerts' })
  async findAll(@Query('orgId') orgId: string, @Query() query: AlertQueryDto) {
    return this.alertsService.findAll(orgId, query)
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Alert counts by status/severity' })
  async getStats(@Query('orgId') orgId: string) {
    return this.alertsService.getStats(orgId)
  }

  @Post('generate')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH)
  @ApiOperation({ summary: 'Scan ACWR calculations and raise alerts for at-risk athletes' })
  async generate(@Query('orgId') orgId: string) {
    return this.alertsService.generateForOrg(orgId)
  }

  @Post('escalate')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Escalate stale unacknowledged critical alerts' })
  async escalate(@Query('orgId') orgId: string) {
    return this.alertsService.escalateStaleCriticalAlerts(orgId)
  }

  @Patch(':id/acknowledge')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Acknowledge an alert' })
  async acknowledge(@Param('id') id: string, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.alertsService.acknowledge(id, orgId, (req.user as any)?.id)
  }

  @Patch(':id/resolve')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Resolve an alert' })
  async resolve(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() body: ResolveAlertDto,
    @Req() req: Request,
  ) {
    return this.alertsService.resolve(id, orgId, body.note, (req.user as any)?.id)
  }
}
