import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { Role } from '@prisma/client'
import { ComplianceService } from './compliance.service'
import { Roles } from '../../common/decorators/roles.decorator'

const userIdOf = (req: Request): string | undefined => (req.user as any)?.id

@ApiTags('Compliance')
@ApiBearerAuth()
@Controller('compliance')
export class ComplianceController {
  constructor(private compliance: ComplianceService) {}

  @Get('athletes/:id/export')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'GDPR data portability export for an athlete (JSON)' })
  async exportAthlete(@Param('id') id: string, @Query('orgId') orgId: string) {
    return this.compliance.exportAthleteData(orgId, id)
  }

  @Post('athletes/:id/erase')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Request GDPR erasure (soft-delete + scheduled hard delete)' })
  async erase(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @Body() body: { reason?: string },
    @Req() req: Request,
  ) {
    return this.compliance.requestErasure(orgId, id, userIdOf(req), body?.reason)
  }

  @Get('erasure-requests')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'List erasure requests' })
  async list(@Query('orgId') orgId: string) {
    return this.compliance.listErasureRequests(orgId)
  }

  @Delete('erasure-requests/:id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Cancel a pending erasure request and restore the athlete' })
  async cancel(@Param('id') id: string, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.compliance.cancelErasure(id, orgId, userIdOf(req))
  }

  @Post('erasure-requests/process')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Execute due hard deletes (ops/cron trigger)' })
  async process(@Query('orgId') _orgId: string) {
    return this.compliance.processDueErasures()
  }
}
