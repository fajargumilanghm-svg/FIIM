import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AthletesService } from './athletes.service'
import { CreateAthleteDto, UpdateAthleteDto } from './dto/athletes.dto'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'
import { Request } from 'express'

@ApiTags('Athletes')
@ApiBearerAuth()
@Controller('athletes')
export class AthletesController {
  constructor(private athletesService: AthletesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'List all athletes in organization' })
  @ApiResponse({ status: 200, description: 'List of athletes' })
  async findAll(
    @Query('orgId') orgId: string,
    @Query('status') status?: string,
    @Query('sportId') sportId?: string,
    @Query('search') search?: string,
    @Req() req?: Request,
  ) {
    return this.athletesService.findAll(orgId, (req as any).user, { status, sportId, search })
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST)
  @ApiOperation({ summary: 'Get athlete statistics' })
  @ApiResponse({ status: 200, description: 'Athlete statistics' })
  async getStats(@Query('orgId') orgId: string, @Req() req: Request) {
    return this.athletesService.getStats(orgId, (req as any).user)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get athlete by ID' })
  @ApiResponse({ status: 200, description: 'Athlete found' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  async findOne(@Param('id') id: string, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.athletesService.findOne(id, orgId, (req as any).user)
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH)
  @ApiOperation({ summary: 'Create new athlete' })
  @ApiResponse({ status: 201, description: 'Athlete created' })
  async create(@Body() createDto: CreateAthleteDto, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.athletesService.create(createDto, orgId, (req as any).user)
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'Update athlete' })
  @ApiResponse({ status: 200, description: 'Athlete updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAthleteDto,
    @Query('orgId') orgId: string,
    @Req() req: Request,
  ) {
    return this.athletesService.update(id, updateDto, orgId, (req as any).user)
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Soft delete athlete' })
  @ApiResponse({ status: 200, description: 'Athlete removed' })
  async remove(@Param('id') id: string, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.athletesService.remove(id, orgId, (req as any).user)
  }
}
