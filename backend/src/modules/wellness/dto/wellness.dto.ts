import { IsUUID, IsOptional, IsInt, IsString, IsDateString, IsBoolean, IsEnum } from 'class-validator'

export class CreateWellnessSurveyDto {
  @IsUUID()
  athleteId: string

  @IsDateString()
  surveyDate: string

  @IsOptional()
  @IsInt()
  sleepQuality?: number

  @IsOptional()
  sleepHours?: number

  @IsOptional()
  @IsInt()
  fatigueLevel?: number

  @IsOptional()
  @IsInt()
  mood?: number

  @IsOptional()
  @IsInt()
  stressLevel?: number

  @IsOptional()
  @IsInt()
  muscleSoreness?: number

  @IsOptional()
  @IsInt()
  hydration?: number

  @IsOptional()
  @IsInt()
  nutrition?: number

  @IsOptional()
  @IsBoolean()
  illness?: boolean

  @IsOptional()
  @IsString()
  injuryConcern?: string

  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateWellnessSurveyDto {
  @IsOptional()
  @IsInt()
  sleepQuality?: number

  @IsOptional()
  sleepHours?: number

  @IsOptional()
  @IsInt()
  fatigueLevel?: number

  @IsOptional()
  @IsInt()
  mood?: number

  @IsOptional()
  @IsInt()
  stressLevel?: number

  @IsOptional()
  @IsInt()
  muscleSoreness?: number

  @IsOptional()
  @IsInt()
  hydration?: number

  @IsOptional()
  @IsInt()
  nutrition?: number

  @IsOptional()
  @IsBoolean()
  illness?: boolean

  @IsOptional()
  @IsString()
  injuryConcern?: string

  @IsOptional()
  @IsString()
  notes?: string
}
