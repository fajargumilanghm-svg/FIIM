import { Injectable, Optional } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CalculationEngine, CalculationConfig } from './services/calculation.engine'

@Injectable()
export class CalculationsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private audit?: AuditService,
  ) {}

  async getAlgorithmConfig(orgId: string) {
    const config = await this.prisma.algorithmConfiguration.findUnique({
      where: { orgId },
    })

    if (!config) {
      // Create default config
      return this.prisma.algorithmConfiguration.create({
        data: {
          orgId,
          acuteWindowDays: 7,
          chronicWindowDays: 21,
          veryLowThreshold: 0.8,
          lowThreshold: 1.0,
          moderateThreshold: 1.3,
          highThreshold: 1.5,
          enableAcwr: true,
          enableEWMA: false,
        },
      })
    }

    return config
  }

  async updateAlgorithmConfig(orgId: string, data: Partial<CalculationConfig>) {
    await this.audit?.log({
      orgId,
      action: 'CONFIG_CHANGED',
      entityType: 'algorithm_configuration',
      entityId: orgId,
      description: 'Updated ACWR algorithm configuration',
      newValues: data as any,
    })
    return this.prisma.algorithmConfiguration.upsert({
      where: { orgId },
      create: {
        orgId,
        acuteWindowDays: data.acuteWindowDays ?? 7,
        chronicWindowDays: data.chronicWindowDays ?? 21,
        veryLowThreshold: data.veryLowThreshold ?? 0.8,
        lowThreshold: data.lowThreshold ?? 1.0,
        moderateThreshold: data.moderateThreshold ?? 1.3,
        highThreshold: data.highThreshold ?? 1.5,
        enableAcwr: data.enableAcwr ?? true,
        enableEWMA: data.enableEWMA ?? false,
        ewmaConstant: data.ewmaConstant ?? 0.5,
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
    })
  }

  async calculateAthleteAcwr(athleteId: string, orgId: string, targetDate?: Date) {
    const calcDate = targetDate || new Date()
    
    // Get algorithm config
    const config = await this.getAlgorithmConfig(orgId)
    
    // Get all session loads for athlete in the past 28+ days
    const windowStart = new Date(calcDate)
    windowStart.setDate(windowStart.getDate() - (config.chronicWindowDays + 7)) // Extra buffer

    const sessions = await this.prisma.athleteSessionLoad.findMany({
      where: {
        athleteId,
        orgId,
        createdAt: { gte: windowStart },
        rpeScore: { not: null },
        durationMinutes: { not: null },
      },
      include: {
        session: {
          select: { scheduledDate: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Aggregate daily loads
    const dailyLoads = CalculationEngine.aggregateDailyLoads(
      sessions.map((s) => ({
        date: s.session?.scheduledDate || s.createdAt,
        rpeScore: s.rpeScore || 0,
        durationMinutes: s.durationMinutes || 0,
      }))
    )

    // Run calculation engine
    const engineConfig: CalculationConfig = {
      acuteWindowDays: config.acuteWindowDays,
      chronicWindowDays: config.chronicWindowDays,
      veryLowThreshold: config.veryLowThreshold,
      lowThreshold: config.lowThreshold,
      moderateThreshold: config.moderateThreshold,
      highThreshold: config.highThreshold,
      enableEWMA: config.enableEWMA,
      ewmaConstant: config.ewmaConstant || 0.5,
    }

    const engine = new CalculationEngine(engineConfig)
    const result = engine.calculateAcwr(dailyLoads, calcDate)

    if (!result) {
      return {
        athleteId,
        calcDate,
        message: 'Insufficient training data for ACWR calculation',
      }
    }

    // Save calculation result
    const saved = await this.prisma.athleteLoadCalculation.upsert({
      where: {
        athleteId_calcDate: {
          athleteId,
          calcDate: new Date(calcDate.toISOString().split('T')[0]),
        },
      },
      create: {
        orgId,
        athleteId,
        calcDate: new Date(calcDate.toISOString().split('T')[0]),
        acuteLoad: result.acuteLoad,
        chronicLoad: result.chronicLoad,
        acwr: result.acwr,
        ewmaAcwr: result.ewmaAcwr,
        riskLevel: result.riskLevel,
        riskColor: result.riskColor,
        totalSessions: sessions.length,
        totalDuration: sessions.reduce((sum: any, s: any) => sum + (s.durationMinutes || 0), 0),
        totalDistance: sessions.reduce((sum: any, s: any) => sum + (s.distanceMeters || 0), 0),
        avgRpe: sessions.length > 0
          ? sessions.reduce((sum: any, s: any) => sum + (s.rpeScore || 0), 0) / sessions.length
          : null,
        dataPoints: result.dataPoints,
      },
      update: {
        acuteLoad: result.acuteLoad,
        chronicLoad: result.chronicLoad,
        acwr: result.acwr,
        ewmaAcwr: result.ewmaAcwr,
        riskLevel: result.riskLevel,
        riskColor: result.riskColor,
        totalSessions: sessions.length,
        totalDuration: sessions.reduce((sum: any, s: any) => sum + (s.durationMinutes || 0), 0),
        totalDistance: sessions.reduce((sum: any, s: any) => sum + (s.distanceMeters || 0), 0),
        avgRpe: sessions.length > 0
          ? sessions.reduce((sum: any, s: any) => sum + (s.rpeScore || 0), 0) / sessions.length
          : null,
        dataPoints: result.dataPoints,
        updatedAt: new Date(),
      },
    })

    return {
      ...saved,
      athlete: await this.prisma.athlete.findUnique({
        where: { id: athleteId },
        select: { firstName: true, lastName: true, position: { select: { name: true } } },
      }),
    }
  }

  async calculateAllAthletes(orgId: string, targetDate?: Date) {
    const athletes = await this.prisma.athlete.findMany({
      where: { orgId, deletedAt: null, status: 'ACTIVE' },
    })

    const results = []
    for (const athlete of athletes) {
      try {
        const result = await this.calculateAthleteAcwr(athlete.id, orgId, targetDate)
        results.push(result)
      } catch (error) {
        results.push({
          athleteId: athlete.id,
          error: error instanceof Error ? error.message : 'Calculation failed',
        })
      }
    }

    return results
  }

  async getAthleteAcwrHistory(athleteId: string, orgId: string, days = 30) {
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    return this.prisma.athleteLoadCalculation.findMany({
      where: {
        athleteId,
        orgId,
        calcDate: { gte: dateFrom },
      },
      orderBy: { calcDate: 'asc' },
    })
  }

  async getTeamAcwrSummary(orgId: string, targetDate?: Date) {
    const calcDate = targetDate || new Date()
    const dateStr = calcDate.toISOString().split('T')[0]

    // Ensure calculations exist
    await this.calculateAllAthletes(orgId, calcDate)

    const calculations = await this.prisma.athleteLoadCalculation.findMany({
      where: {
        orgId,
        calcDate: new Date(dateStr),
      },
      include: {
        athlete: {
          select: { id: true, firstName: true, lastName: true, position: { select: { name: true } } },
        },
      },
    })

    const riskDistribution = {
      VERY_LOW: calculations.filter((c: any) => c.riskLevel === 'VERY_LOW').length,
      LOW: calculations.filter((c: any) => c.riskLevel === 'LOW').length,
      MODERATE: calculations.filter((c: any) => c.riskLevel === 'MODERATE').length,
      HIGH: calculations.filter((c: any) => c.riskLevel === 'HIGH').length,
      VERY_HIGH: calculations.filter((c: any) => c.riskLevel === 'VERY_HIGH').length,
      INSUFFICIENT_DATA: calculations.filter((c: any) => c.riskLevel === 'INSUFFICIENT_DATA').length,
    }

    return {
      date: dateStr,
      totalAthletes: calculations.length,
      calculatedAt: new Date(),
      riskDistribution,
      atRiskCount: riskDistribution.HIGH + riskDistribution.VERY_HIGH,
      atRiskPercentage: calculations.length > 0
        ? parseFloat(((riskDistribution.HIGH + riskDistribution.VERY_HIGH) / calculations.length * 100).toFixed(1))
        : 0,
      athletes: calculations.map((c) => ({
        athleteId: c.athleteId,
        name: `${c.athlete?.firstName} ${c.athlete?.lastName}`,
        position: c.athlete?.position?.name,
        acuteLoad: c.acuteLoad,
        chronicLoad: c.chronicLoad,
        acwr: c.acwr,
        ewmaAcwr: c.ewmaAcwr,
        riskLevel: c.riskLevel,
        riskColor: c.riskColor,
        dataPoints: c.dataPoints,
      })),
    }
  }
}
