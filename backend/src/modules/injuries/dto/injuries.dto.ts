import { IsUUID, IsOptional, IsString, IsInt, IsDateString, IsEnum, Min } from 'class-validator'
import { InjuryMechanism, InjurySeverity, InjuryStatus } from '@prisma/client'

export class CreateInjuryDto {
  @IsUUID()
  athleteId: string

  @IsString()
  bodyPart: string

  @IsOptional()
  @IsString()
  injuryType?: string

  @IsOptional()
  @IsEnum(InjuryMechanism)
  mechanism?: InjuryMechanism

  @IsOptional()
  @IsEnum(InjurySeverity)
  severity?: InjurySeverity

  @IsOptional()
  @IsString()
  description?: string

  @IsDateString()
  onsetDate: string

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string
}

export class UpdateInjuryDto {
  @IsOptional()
  @IsString()
  bodyPart?: string

  @IsOptional()
  @IsString()
  injuryType?: string

  @IsOptional()
  @IsEnum(InjuryMechanism)
  mechanism?: InjuryMechanism

  @IsOptional()
  @IsEnum(InjurySeverity)
  severity?: InjurySeverity

  @IsOptional()
  @IsEnum(InjuryStatus)
  status?: InjuryStatus

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string

  @IsOptional()
  @IsDateString()
  actualReturnDate?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  daysLost?: number
}

export class InjuryQueryDto {
  // Passed alongside filters; declared so the whitelisting pipe allows it.
  @IsOptional()
  @IsString()
  orgId?: string

  @IsOptional()
  @IsEnum(InjuryStatus)
  status?: InjuryStatus

  @IsOptional()
  @IsEnum(InjurySeverity)
  severity?: InjurySeverity

  @IsOptional()
  @IsString()
  athleteId?: string
}
