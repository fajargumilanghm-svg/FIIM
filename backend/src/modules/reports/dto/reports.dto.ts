import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional } from 'class-validator'
import { ReportFormat, ReportType, ScheduleFrequency } from '@prisma/client'

export class CreateScheduleDto {
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType

  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat

  @IsEnum(ScheduleFrequency)
  frequency: ScheduleFrequency

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipients?: string[]

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat

  @IsOptional()
  @IsEnum(ScheduleFrequency)
  frequency?: ScheduleFrequency

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipients?: string[]

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}
