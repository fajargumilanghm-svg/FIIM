import { IsOptional, IsString, IsEnum } from 'class-validator'
import { AlertSeverity, AlertStatus, AlertType } from '@prisma/client'

export class AlertQueryDto {
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus

  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity

  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType

  @IsOptional()
  @IsString()
  athleteId?: string
}

export class ResolveAlertDto {
  @IsOptional()
  @IsString()
  note?: string
}
