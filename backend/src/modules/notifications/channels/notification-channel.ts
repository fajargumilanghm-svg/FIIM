import { Logger } from '@nestjs/common'

export interface NotificationPayload {
  to: string // email address or phone number
  title: string
  body: string
  severity?: string | null
}

/**
 * Delivery channel abstraction. Concrete channels (email via SMTP/SendGrid,
 * SMS via Twilio, push via FCM/APNS) implement `send`. The default
 * implementations log the payload so the dispatch pipeline is fully exercised
 * without external credentials — swap the body for a real transport in prod.
 */
export interface INotificationChannel {
  readonly channel: string
  send(payload: NotificationPayload): Promise<void>
}

export class EmailChannel implements INotificationChannel {
  readonly channel = 'EMAIL'
  private readonly logger = new Logger(EmailChannel.name)

  async send(payload: NotificationPayload): Promise<void> {
    // TODO: wire SMTP / SendGrid. Kept as a logged fallback for now.
    this.logger.log(`[EMAIL→${payload.to}] ${payload.title}`)
  }
}

export class SmsChannel implements INotificationChannel {
  readonly channel = 'SMS'
  private readonly logger = new Logger(SmsChannel.name)

  async send(payload: NotificationPayload): Promise<void> {
    // TODO: wire Twilio (dependency already present). Logged fallback for now.
    this.logger.log(`[SMS→${payload.to}] ${payload.title}`)
  }
}

export class PushChannel implements INotificationChannel {
  readonly channel = 'PUSH'
  private readonly logger = new Logger(PushChannel.name)

  async send(payload: NotificationPayload): Promise<void> {
    // TODO: wire FCM/APNS. Logged fallback for now.
    this.logger.log(`[PUSH→${payload.to}] ${payload.title}`)
  }
}
