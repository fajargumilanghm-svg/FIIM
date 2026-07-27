import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { Role } from '@prisma/client'
import { InjuriesService } from './injuries.service'
import { CreateInjuryDto, UpdateInjuryDto, InjuryQueryDto } from './dto/injuries.dto'
import { Roles } from '../../common/decorators/roles.decorator'

@ApiTags('Injuries')
@ApiBearerAuth()
@Controller('injuries')
export class InjuriesController {
  constructor(private injuriesService: InjuriesService) {}

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
}
