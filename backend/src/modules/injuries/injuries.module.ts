import { Module } from '@nestjs/common'
import { InjuriesService } from './injuries.service'
import { InjuryMedicalService } from './injury-medical.service'
import { InjuriesController } from './injuries.controller'

@Module({
  providers: [InjuriesService, InjuryMedicalService],
  controllers: [InjuriesController],
  exports: [InjuriesService, InjuryMedicalService],
})
export class InjuriesModule {}
