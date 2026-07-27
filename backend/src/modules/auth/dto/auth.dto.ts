import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsBoolean } from 'class-validator'

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsOptional()
  @IsString()
  mfaCode?: string

  @IsOptional()
  @IsString()
  orgSlug?: string
}

export class RegisterDto {
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
  orgSlug?: string

  @IsOptional()
  @IsString()
  inviteCode?: string
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @IsString()
  token: string

  @IsString()
  @MinLength(8)
  newPassword: string
}

export class SetupMfaDto {
  @IsString()
  code: string

  @IsOptional()
  @IsEnum(['TOTP', 'SMS', 'EMAIL'])
  method?: string
}

export class VerifyMfaDto {
  @IsString()
  code: string
}

export class UpdatePasswordDto {
  @IsString()
  currentPassword: string

  @IsString()
  @MinLength(8)
  newPassword: string
}

export class AuthResponseDto {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    displayName: string | null
    avatarUrl: string | null
    role: string
    orgId: string | null
    orgName: string | null
    mfaRequired: boolean
    mfaEnabled: boolean
  }
}
