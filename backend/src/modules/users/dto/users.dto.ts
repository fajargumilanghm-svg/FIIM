import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsUUID, IsInt, IsBoolean } from 'class-validator'
import { Role } from '@prisma/client'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  firstName: string

  @IsString()
  lastName: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @IsOptional()
  @IsUUID()
  orgId?: string
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsString()
  displayName?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  notificationPreferences?: any
}

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role: Role

  @IsUUID()
  orgId: string
}

export class UpdateNotificationPrefsDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean

  @IsOptional()
  @IsString()
  quietHoursStart?: string

  @IsOptional()
  @IsString()
  quietHoursEnd?: string
}
