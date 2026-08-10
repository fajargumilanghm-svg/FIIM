import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator'

export class UpdateNotificationPreferenceDto {
  @IsOptional()
  @IsBoolean()
  inApp?: boolean

  @IsOptional()
  @IsBoolean()
  email?: boolean

  @IsOptional()
  @IsBoolean()
  sms?: boolean

  @IsOptional()
  @IsBoolean()
  push?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  quietHoursStart?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  quietHoursEnd?: number

  @IsOptional()
  @IsBoolean()
  digest?: boolean
}
