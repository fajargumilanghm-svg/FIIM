import { Controller, Get, Patch, Body, Query, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { Role } from '@prisma/client'
import { AdminService } from './admin.service'
import { UpdateOrganizationDto } from './dto/admin.dto'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('overview')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'System overview: users, athletes, teams, activity' })
  async getOverview(@Query('orgId') orgId: string) {
    return this.adminService.getOverview(orgId)
  }

  @Get('organization')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get organization profile & compliance settings' })
  async getOrganization(@Query('orgId') orgId: string) {
    return this.adminService.getOrganization(orgId)
  }

  @Patch('organization')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Update organization profile & compliance settings' })
  async updateOrganization(
    @Query('orgId') orgId: string,
    @Body() data: UpdateOrganizationDto,
    @Req() req: Request,
  ) {
    return this.adminService.updateOrganization(orgId, data, (req.user as any)?.id)
  }
}
