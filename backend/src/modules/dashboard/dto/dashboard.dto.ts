import { IsOptional, IsUUID, IsDateString } from 'class-validator'

export class DashboardStatsDto {
  @IsUUID()
  orgId: string

  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @IsOptional()
  @IsDateString()
  dateTo?: string
}
