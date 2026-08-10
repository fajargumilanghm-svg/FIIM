import { Module } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { ReportPdfService } from './report-pdf.service'
import { ReportSchedulerService } from './report-scheduler.service'
import { ReportsController } from './reports.controller'
import { CalculationsModule } from '../calculations/calculations.module'
import { InjuriesModule } from '../injuries/injuries.module'
import { WellnessModule } from '../wellness/wellness.module'

@Module({
  imports: [CalculationsModule, InjuriesModule, WellnessModule],
  providers: [ReportsService, ReportPdfService, ReportSchedulerService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
