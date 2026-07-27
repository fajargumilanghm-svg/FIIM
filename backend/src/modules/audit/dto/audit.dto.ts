import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator'
import { AuditAction } from '@prisma/client'

export class AuditQueryDto {
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction

  @IsOptional()
  @IsString()
  entityType?: string

  @IsOptional()
  @IsString()
  userId?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number
}
