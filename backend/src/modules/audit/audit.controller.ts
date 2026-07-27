import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { AuditService } from './audit.service'
import { AuditQueryDto } from './dto/audit.dto'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'List audit log entries' })
  async findAll(@Query('orgId') orgId: string, @Query() query: AuditQueryDto) {
    return this.auditService.findAll(orgId, query)
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Audit counts by action' })
  async getStats(@Query('orgId') orgId: string) {
    return this.auditService.getStats(orgId)
  }
}
