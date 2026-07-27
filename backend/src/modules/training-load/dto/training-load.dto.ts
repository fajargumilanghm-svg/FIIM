import { IsUUID, IsOptional, IsString, IsInt, IsDateString, IsEnum, IsNumber } from 'class-validator'
import { SessionType } from '@prisma/client'

export class CreateTrainingSessionDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType

  @IsDateString()
  scheduledDate: string

  @IsOptional()
  @IsDateString()
  startTime?: string

  @IsOptional()
  @IsDateString()
  endTime?: string

  @IsOptional()
  @IsInt()
  durationMinutes?: number

  @IsOptional()
  @IsUUID()
  sportId?: string

  @IsOptional()
  @IsUUID()
  teamId?: string

  @IsOptional()
  @IsString()
  location?: string

  @IsOptional()
  @IsInt()
  plannedRpe?: number

  @IsOptional()
  @IsInt()
  plannedLoad?: number
}

export class UpdateTrainingSessionDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType

  @IsOptional()
  @IsDateString()
  scheduledDate?: string

  @IsOptional()
  @IsInt()
  durationMinutes?: number

  @IsOptional()
  @IsInt()
  plannedRpe?: number

  @IsOptional()
  @IsInt()
  plannedLoad?: number

  @IsOptional()
  @IsString()
  status?: string
}

export class CreateAthleteSessionLoadDto {
  @IsUUID()
  athleteId: string

  @IsOptional()
  @IsInt()
  rpeScore?: number

  @IsOptional()
  @IsInt()
  durationMinutes?: number

  @IsOptional()
  @IsNumber()
  distanceMeters?: number

  @IsOptional()
  @IsNumber()
  highSpeedDistance?: number

  @IsOptional()
  @IsNumber()
  sprintDistance?: number

  @IsOptional()
  @IsInt()
  accelerations?: number

  @IsOptional()
  @IsInt()
  decelerations?: number

  @IsOptional()
  @IsInt()
  heartRateAvg?: number

  @IsOptional()
  @IsInt()
  heartRateMax?: number

  @IsOptional()
  @IsInt()
  wellnessPre?: number

  @IsOptional()
  @IsInt()
  wellnessPost?: number

  @IsOptional()
  @IsString()
  notes?: string
}
