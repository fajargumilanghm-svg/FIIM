import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import * as cron from 'node-cron'
import { ReportsService } from './reports.service'

/**
 * Hourly tick that fires any scheduled reports whose next-run time has passed.
 * A single cron keeps things simple and avoids per-schedule job churn; the
 * due-selection logic lives in ReportsService.runDueSchedules.
 */
@Injectable()
export class ReportSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportSchedulerService.name)
  private task?: cron.ScheduledTask

  constructor(private reports: ReportsService) {}

  onModuleInit() {
    // Don't spin up timers during tests.
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_CRON === 'true') return

    this.task = cron.schedule('0 * * * *', async () => {
      try {
        const result = await this.reports.runDueSchedules()
        if (result.ran > 0) {
          this.logger.log(`Scheduled reports: ran ${result.ran}/${result.due} due`)
        }
      } catch (err) {
        this.logger.error(`Scheduled report tick failed: ${err}`)
      }
    })
    this.logger.log('Report scheduler started (hourly)')
  }

  onModuleDestroy() {
    this.task?.stop()
  }
}
