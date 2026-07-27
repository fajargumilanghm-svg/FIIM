import { Module } from '@nestjs/common'
import { CalculationsService } from './calculations.service'
import { CalculationsController } from './calculations.controller'

@Module({
  providers: [CalculationsService],
  controllers: [CalculationsController],
  exports: [CalculationsService],
})
export class CalculationsModule {}
