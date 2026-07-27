import { Module } from '@nestjs/common'
import { InjuriesService } from './injuries.service'
import { InjuriesController } from './injuries.controller'

@Module({
  providers: [InjuriesService],
  controllers: [InjuriesController],
  exports: [InjuriesService],
})
export class InjuriesModule {}
