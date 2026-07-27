import { IsString, IsOptional, IsEnum, IsUUID, IsInt, IsEmail, IsDateString, IsNumber, IsBoolean } from 'class-validator'
import { Gender, AthleteStatus } from '@prisma/client'

export class CreateAthleteDto {
  @IsString()
  firstName: string

  @IsString()
  lastName: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender

  @IsOptional()
  @IsString()
  nationality?: string

  @IsOptional()
  @IsNumber()
  heightCm?: number

  @IsOptional()
  @IsNumber()
  weightKg?: number

  @IsOptional()
  @IsString()
  dominantSide?: string

  @IsOptional()
  @IsString()
  bloodType?: string

  @IsOptional()
  @IsString()
  allergies?: string

  @IsOptional()
  @IsString()
  medications?: string

  @IsOptional()
  @IsString()
  medicalNotes?: string

  @IsOptional()
  @IsUUID()
  sportId?: string

  @IsOptional()
  @IsUUID()
  positionId?: string

  @IsOptional()
  @IsInt()
  jerseyNumber?: number

  @IsOptional()
  @IsEnum(AthleteStatus)
  status?: AthleteStatus

  @IsOptional()
  @IsDateString()
  joinedDate?: string

  @IsOptional()
  @IsDateString()
  contractEnd?: string

  @IsOptional()
  @IsString()
  emergencyContactName?: string

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string

  @IsOptional()
  @IsString()
  emergencyContactRelation?: string

  @IsOptional()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateAthleteDto {
  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender

  @IsOptional()
  @IsNumber()
  heightCm?: number

  @IsOptional()
  @IsNumber()
  weightKg?: number

  @IsOptional()
  @IsUUID()
  sportId?: string

  @IsOptional()
  @IsUUID()
  positionId?: string

  @IsOptional()
  @IsInt()
  jerseyNumber?: number

  @IsOptional()
  @IsEnum(AthleteStatus)
  status?: AthleteStatus

  @IsOptional()
  @IsString()
  injuryStatus?: string

  @IsOptional()
  @IsDateString()
  returnToPlayDate?: string

  @IsOptional()
  @IsDateString()
  joinedDate?: string

  @IsOptional()
  @IsDateString()
  contractEnd?: string

  @IsOptional()
  @IsString()
  emergencyContactName?: string

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string

  @IsOptional()
  @IsString()
  emergencyContactRelation?: string

  @IsOptional()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  notes?: string
}
