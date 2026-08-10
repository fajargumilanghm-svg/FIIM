import { NotificationsService } from '../notifications.service'
import { INotificationChannel, NotificationPayload } from '../channels/notification-channel'

class SpyChannel implements INotificationChannel {
  sent: NotificationPayload[] = []
  constructor(public readonly channel: string) {}
  async send(p: NotificationPayload) {
    this.sent.push(p)
  }
}

function makePrisma(pref: any = null) {
  const created: any[] = []
  return {
    _created: created,
    notificationPreference: {
      findUnique: jest.fn().mockResolvedValue(pref),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ inApp: true, email: true, sms: false, push: false, quietHoursStart: null, quietHoursEnd: null, ...data })),
      upsert: jest.fn().mockImplementation(({ create, update }: any) => Promise.resolve({ ...create, ...update })),
    },
    notification: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        const row = { id: `n${created.length + 1}`, ...data }
        created.push(row)
        return Promise.resolve(row)
      }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(3),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 5 }),
    },
    userOrganization: {
      findMany: jest.fn().mockResolvedValue([
        { user: { id: 'u1', email: 'a@x.com', phone: '+100' } },
        { user: { id: 'u2', email: 'b@x.com', phone: null } },
      ]),
    },
  }
}

describe('NotificationsService.isWithinQuietHours', () => {
  it('handles a normal window', () => {
    expect(NotificationsService.isWithinQuietHours(23, 22, 7)).toBe(true)
    expect(NotificationsService.isWithinQuietHours(3, 22, 7)).toBe(true)
    expect(NotificationsService.isWithinQuietHours(12, 22, 7)).toBe(false)
  })
  it('handles a same-day window', () => {
    expect(NotificationsService.isWithinQuietHours(1, 0, 6)).toBe(true)
    expect(NotificationsService.isWithinQuietHours(6, 0, 6)).toBe(false)
  })
  it('returns false when unset', () => {
    expect(NotificationsService.isWithinQuietHours(3, null, null)).toBe(false)
    expect(NotificationsService.isWithinQuietHours(3, 5, 5)).toBe(false)
  })
})

describe('NotificationsService.notifyUser', () => {
  it('records an in-app row and fans out to email when enabled', async () => {
    const prisma = makePrisma({ inApp: true, email: true, sms: true, push: false, quietHoursStart: null, quietHoursEnd: null })
    const email = new SpyChannel('EMAIL')
    const sms = new SpyChannel('SMS')
    const svc = new NotificationsService(prisma as any, [email, sms])

    await svc.notifyUser('org', { id: 'u1', email: 'a@x.com', phone: '+100' }, {
      type: 'ALERT',
      title: 'Test',
      body: 'body',
      severity: 'WARNING',
    })

    expect(prisma.notification.create).toHaveBeenCalled()
    expect(prisma._created[0].channels).toEqual(expect.arrayContaining(['IN_APP', 'EMAIL', 'SMS']))
    expect(email.sent).toHaveLength(1)
    expect(sms.sent).toHaveLength(1)
  })

  it('suppresses external channels during quiet hours for non-critical', async () => {
    const prisma = makePrisma({ inApp: true, email: true, sms: false, push: false, quietHoursStart: 0, quietHoursEnd: 23 })
    const email = new SpyChannel('EMAIL')
    const svc = new NotificationsService(prisma as any, [email])
    // 10:00 is within 0–23 window
    await svc.notifyUser('org', { id: 'u1', email: 'a@x.com' }, {
      type: 'ALERT', title: 'T', body: 'b', severity: 'WARNING',
    }, new Date('2026-08-05T10:00:00'))

    expect(prisma._created[0].channels).toEqual(['IN_APP'])
    expect(email.sent).toHaveLength(0)
  })

  it('lets CRITICAL break through quiet hours', async () => {
    const prisma = makePrisma({ inApp: true, email: true, sms: false, push: false, quietHoursStart: 0, quietHoursEnd: 23 })
    const email = new SpyChannel('EMAIL')
    const svc = new NotificationsService(prisma as any, [email])
    await svc.notifyUser('org', { id: 'u1', email: 'a@x.com' }, {
      type: 'ALERT', title: 'T', body: 'b', severity: 'CRITICAL',
    }, new Date('2026-08-05T10:00:00'))

    expect(prisma._created[0].channels).toEqual(expect.arrayContaining(['IN_APP', 'EMAIL']))
    expect(email.sent).toHaveLength(1)
  })
})

describe('NotificationsService.dispatchToRoles', () => {
  it('notifies every matching org member', async () => {
    const prisma = makePrisma({ inApp: true, email: true, sms: false, push: false, quietHoursStart: null, quietHoursEnd: null })
    const svc = new NotificationsService(prisma as any, [new SpyChannel('EMAIL')])
    const res = await svc.dispatchToRoles('org', { type: 'ALERT', title: 'T', body: 'b' })
    expect(res.recipients).toBe(2)
    expect(prisma.notification.create).toHaveBeenCalledTimes(2)
  })
})

describe('NotificationsService inbox', () => {
  it('marks all read', async () => {
    const prisma = makePrisma()
    const svc = new NotificationsService(prisma as any, [])
    expect(await svc.markAllRead('u1')).toEqual({ updated: 5 })
    expect(await svc.unreadCount('u1')).toEqual({ unread: 3 })
  })
})
