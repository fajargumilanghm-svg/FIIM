import { Module } from '@nestjs/common'
import { WellnessService } from './wellness.service'
import { WellnessController } from './wellness.controller'

@Module({
  providers: [WellnessService],
  controllers: [WellnessController],
  exports: [WellnessService],
})
export class WellnessModule {}
