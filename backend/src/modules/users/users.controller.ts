import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto, UpdateNotificationPrefsDto } from './dto/users.dto'
import { Roles } from '../../common/decorators/roles.decorator'
import { Role } from '@prisma/client'
import { Request } from 'express'

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF)
  @ApiOperation({ summary: 'List all users in organization' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll(@Query('orgId') orgId: string, @Req() req: Request) {
    return this.usersService.findAll(orgId, (req as any).user)
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user detailed profile' })
  @ApiResponse({ status: 200, description: 'Current user profile with organizations' })
  async findMe(@Req() req: Request) {
    return this.usersService.findMe((req as any).user.sub)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string, @Query('orgId') orgId: string, @Req() req: Request) {
    return this.usersService.findOne(id, orgId, (req as any).user)
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(@Body() createDto: CreateUserDto, @Req() req: Request) {
    return this.usersService.create(createDto, (req as any).user)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto, @Req() req: Request) {
    return this.usersService.update(id, updateDto, (req as any).user)
  }

  @Patch(':id/role')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Update user role in organization' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateRole(@Param('id') id: string, @Body() roleDto: UpdateUserRoleDto, @Req() req: Request) {
    return this.usersService.updateRole(id, roleDto, (req as any).user)
  }

  @Patch('me/notifications')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updateNotifications(@Body() prefsDto: UpdateNotificationPrefsDto, @Req() req: Request) {
    const userId = (req as any).user.sub
    return this.usersService.update(userId, {
      notificationPreferences: prefsDto as any,
    }, (req as any).user)
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Soft delete user' })
  @ApiResponse({ status: 200, description: 'User removed' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    return this.usersService.remove(id, (req as any).user)
  }
}
