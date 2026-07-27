import { Module } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { ReportsController } from './reports.controller'
import { CalculationsModule } from '../calculations/calculations.module'
import { InjuriesModule } from '../injuries/injuries.module'
import { WellnessModule } from '../wellness/wellness.module'

@Module({
  imports: [CalculationsModule, InjuriesModule, WellnessModule],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
