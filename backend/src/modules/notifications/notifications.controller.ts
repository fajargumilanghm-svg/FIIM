import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { NotificationsService } from './notifications.service'
import { UpdateNotificationPreferenceDto } from './dto/notifications.dto'

const userIdOf = (req: Request): string => (req.user as any)?.id
const orgIdOf = (req: Request, q?: string): string => q ?? (req.user as any)?.orgId

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user’s notifications' })
  async list(@Req() req: Request, @Query('unread') unread?: string) {
    return this.notifications.listForUser(userIdOf(req), unread === 'true')
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count' })
  async unread(@Req() req: Request) {
    return this.notifications.unreadCount(userIdOf(req))
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification read' })
  async markRead(@Param('id') id: string, @Req() req: Request) {
    return this.notifications.markRead(id, userIdOf(req))
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications read' })
  async markAllRead(@Req() req: Request) {
    return this.notifications.markAllRead(userIdOf(req))
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPrefs(@Req() req: Request, @Query('orgId') orgId?: string) {
    return this.notifications.getPreferences(orgIdOf(req, orgId), userIdOf(req))
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePrefs(
    @Req() req: Request,
    @Body() dto: UpdateNotificationPreferenceDto,
    @Query('orgId') orgId?: string,
  ) {
    return this.notifications.updatePreferences(orgIdOf(req, orgId), userIdOf(req), dto)
  }
}
