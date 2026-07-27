import { IsOptional, IsString, IsBoolean, IsInt, IsEmail, Min, Max, MaxLength } from 'class-validator'

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsBoolean()
  gdprEnabled?: boolean

  @IsOptional()
  @IsBoolean()
  hipaaEnabled?: boolean

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  dataRetentionYears?: number
}
