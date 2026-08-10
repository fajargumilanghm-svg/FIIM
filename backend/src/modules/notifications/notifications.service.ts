import { ForbiddenException, Injectable, Logger, Optional } from '@nestjs/common'
import { Role } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import {
  EmailChannel,
  INotificationChannel,
  PushChannel,
  SmsChannel,
} from './channels/notification-channel'
import { UpdateNotificationPreferenceDto } from './dto/notifications.dto'

export interface NotifyInput {
  type: string // ALERT, MESSAGE, SYSTEM
  title: string
  body: string
  severity?: string | null
  relatedType?: string
  relatedId?: string
}

// Roles that receive operational alerts by default.
export const ALERT_RECIPIENT_ROLES: Role[] = [
  Role.ORGANIZATION_ADMIN,
  Role.COACH,
  Role.MEDICAL_STAFF,
  Role.PERFORMANCE_DIRECTOR,
]

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private prisma: PrismaService,
    @Optional()
    private readonly channels: INotificationChannel[] = [
      new EmailChannel(),
      new SmsChannel(),
      new PushChannel(),
    ],
  ) {}

  /**
   * True when `hour` falls inside the quiet-hours window. Supports windows that
   * wrap past midnight (e.g. 22 → 7).
   */
  static isWithinQuietHours(hour: number, start?: number | null, end?: number | null): boolean {
    if (start == null || end == null) return false
    if (start === end) return false
    if (start < end) return hour >= start && hour < end
    // Wrapping window (e.g. 22:00–07:00)
    return hour >= start || hour < end
  }

  async getPreferences(orgId: string, userId: string) {
    const existing = await this.prisma.notificationPreference.findUnique({ where: { userId } })
    if (existing) return existing
    return this.prisma.notificationPreference.create({ data: { orgId, userId } })
  }

  async updatePreferences(orgId: string, userId: string, dto: UpdateNotificationPreferenceDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { orgId, userId, ...dto },
      update: { ...dto },
    })
  }

  /**
   * Deliver a notification to a single user across their enabled channels,
   * honouring quiet hours (which non-critical channels respect; CRITICAL
   * always breaks through). Always records an in-app row when in-app is on.
   */
  async notifyUser(
    orgId: string,
    recipient: { id: string; email?: string | null; phone?: string | null },
    input: NotifyInput,
    now: Date = new Date(),
  ) {
    const prefs = await this.getPreferences(orgId, recipient.id)
    const isCritical = (input.severity ?? '').toUpperCase() === 'CRITICAL'
    const quiet =
      !isCritical &&
      NotificationsService.isWithinQuietHours(
        now.getHours(),
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
      )

    const channels: string[] = []
    if (prefs.inApp) channels.push('IN_APP')
    if (!quiet) {
      if (prefs.email && recipient.email) channels.push('EMAIL')
      if (prefs.sms && recipient.phone) channels.push('SMS')
      if (prefs.push) channels.push('PUSH')
    }

    const notification = await this.prisma.notification.create({
      data: {
        orgId,
        userId: recipient.id,
        type: input.type,
        severity: input.severity ?? null,
        title: input.title,
        body: input.body,
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
        channels,
      },
    })

    // Fan out to external channels (best-effort; failures are logged, not fatal).
    await Promise.all(
      channels
        .filter((c) => c !== 'IN_APP')
        .map(async (channelName) => {
          const channel = this.channels.find((c) => c.channel === channelName)
          if (!channel) return
          const to = channelName === 'SMS' ? recipient.phone : recipient.email
          if (!to) return
          try {
            await channel.send({ to, title: input.title, body: input.body, severity: input.severity })
          } catch (err) {
            this.logger.warn(`Channel ${channelName} failed for ${recipient.id}: ${err}`)
          }
        }),
    )

    return notification
  }

  /** Fan a notification out to all org members holding the given roles. */
  async dispatchToRoles(
    orgId: string,
    input: NotifyInput,
    roles: Role[] = ALERT_RECIPIENT_ROLES,
    now: Date = new Date(),
  ) {
    const memberships = await this.prisma.userOrganization.findMany({
      where: { orgId, leftAt: null, role: { in: roles } },
      include: { user: { select: { id: true, email: true, phone: true } } },
    })

    let delivered = 0
    for (const m of memberships) {
      if (!m.user) continue
      await this.notifyUser(orgId, m.user, input, now)
      delivered++
    }
    return { recipients: delivered }
  }

  // ---- In-app inbox -------------------------------------------------------

  async listForUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } })
    return { unread: count }
  }

  async markRead(id: string, userId: string) {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId } })
    if (!existing) throw new ForbiddenException('Notification not found')
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
  }

  async markAllRead(userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })
    return { updated: res.count }
  }
}
