import { Module } from '@nestjs/common'
import { TrainingLoadService } from './training-load.service'
import { TrainingLoadController } from './training-load.controller'

@Module({
  providers: [TrainingLoadService],
  controllers: [TrainingLoadController],
  exports: [TrainingLoadService],
})
export class TrainingLoadModule {}
