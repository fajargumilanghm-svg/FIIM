import { IsOptional, IsString, IsEnum } from 'class-validator'
import { AlertSeverity, AlertStatus, AlertType } from '@prisma/client'

export class AlertQueryDto {
  // orgId is passed as a query param alongside the filters; declare it so the
  // whitelisting ValidationPipe does not reject the request.
  @IsOptional()
  @IsString()
  orgId?: string

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
