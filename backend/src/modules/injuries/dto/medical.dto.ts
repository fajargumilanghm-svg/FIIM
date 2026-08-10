import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ClearanceStatus, ConfidentialityLevel, RtpStage } from '@prisma/client'

export class RtpCriterionDto {
  @IsString()
  label: string

  @IsBoolean()
  met: boolean
}

export class UpdateRtpStageDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RtpCriterionDto)
  criteria?: RtpCriterionDto[]

  @IsOptional()
  @IsString()
  notes?: string
}

export class AdvanceRtpDto {
  // Optional target stage; defaults to the next stage in sequence.
  @IsOptional()
  @IsEnum(RtpStage)
  toStage?: RtpStage

  @IsOptional()
  @IsString()
  notes?: string
}

export class CreateDiagnosisDto {
  @IsOptional()
  @IsString()
  icd10Code?: string

  @IsString()
  description: string

  @IsOptional()
  @IsEnum(ConfidentialityLevel)
  confidentiality?: ConfidentialityLevel
}

export class CreateTreatmentNoteDto {
  @IsString()
  note: string

  @IsOptional()
  @IsEnum(ConfidentialityLevel)
  confidentiality?: ConfidentialityLevel

  @IsOptional()
  @IsBoolean()
  medicalHold?: boolean
}

export class CreateClearanceDto {
  @IsEnum(ClearanceStatus)
  status: ClearanceStatus

  @IsOptional()
  restrictions?: Record<string, unknown>

  @IsOptional()
  @IsDateString()
  expiresAt?: string

  @IsOptional()
  @IsDateString()
  followUpDate?: string

  @IsOptional()
  @IsString()
  notes?: string
}
