import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateWellnessSurveyDto, UpdateWellnessSurveyDto } from './dto/wellness.dto'

@Injectable()
export class WellnessService {
  constructor(private prisma: PrismaService) {}

  private calculateWellnessScore(data: Partial<CreateWellnessSurveyDto>): number | null {
    const metrics = [
      data.sleepQuality,
      data.fatigueLevel,
      data.mood,
      data.stressLevel,
      data.muscleSoreness,
      data.hydration,
      data.nutrition,
    ].filter((v): v is number => v !== undefined && v !== null)

    if (metrics.length === 0) return null

    // Average of available metrics (1-10 scale)
    const sum = metrics.reduce((a, b) => a + b, 0)
    return parseFloat((sum / metrics.length).toFixed(2))
  }

  async findAll(orgId: string, filters?: { athleteId?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = { orgId }

    if (filters?.athleteId) {
      where.athleteId = filters.athleteId
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.surveyDate = {}
      if (filters.dateFrom) where.surveyDate.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.surveyDate.lte = new Date(filters.dateTo)
    }

    return this.prisma.wellnessSurvey.findMany({
      where,
      include: {
        athlete: {
          select: { id: true, firstName: true, lastName: true, jerseyNumber: true },
        },
        submittedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { surveyDate: 'desc' },
    })
  }

  async findOne(id: string, orgId: string) {
    const survey = await this.prisma.wellnessSurvey.findFirst({
      where: { id, orgId },
      include: {
        athlete: {
          select: { id: true, firstName: true, lastName: true, jerseyNumber: true, position: true },
        },
        submittedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    if (!survey) {
      throw new NotFoundException('Wellness survey not found')
    }

    return survey
  }

  async create(orgId: string, data: CreateWellnessSurveyDto, submittedById?: string) {
    // Check for duplicate on same date
    const existing = await this.prisma.wellnessSurvey.findUnique({
      where: {
        athleteId_surveyDate: {
          athleteId: data.athleteId,
          surveyDate: new Date(data.surveyDate),
        },
      },
    })

    if (existing) {
      throw new BadRequestException('Wellness survey already exists for this athlete on this date')
    }

    const wellnessScore = this.calculateWellnessScore(data)

    const survey = await this.prisma.wellnessSurvey.create({
      data: {
        orgId,
        athleteId: data.athleteId,
        surveyDate: new Date(data.surveyDate),
        sleepQuality: data.sleepQuality,
        sleepHours: data.sleepHours,
        fatigueLevel: data.fatigueLevel,
        mood: data.mood,
        stressLevel: data.stressLevel,
        muscleSoreness: data.muscleSoreness,
        hydration: data.hydration,
        nutrition: data.nutrition,
        illness: data.illness || false,
        injuryConcern: data.injuryConcern,
        notes: data.notes,
        wellnessScore,
        submittedById,
        source: submittedById ? 'STAFF' : 'WEB',
      },
      include: {
        athlete: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    return survey
  }

  async update(id: string, orgId: string, data: UpdateWellnessSurveyDto) {
    const existing = await this.prisma.wellnessSurvey.findFirst({
      where: { id, orgId },
    })

    if (!existing) {
      throw new NotFoundException('Wellness survey not found')
    }

    const wellnessScore = this.calculateWellnessScore({ ...existing, ...data } as any)

    const survey = await this.prisma.wellnessSurvey.update({
      where: { id },
      data: {
        ...data,
        wellnessScore,
        updatedAt: new Date(),
      },
      include: {
        athlete: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    return survey
  }

  async remove(id: string, orgId: string) {
    const existing = await this.prisma.wellnessSurvey.findFirst({
      where: { id, orgId },
    })

    if (!existing) {
      throw new NotFoundException('Wellness survey not found')
    }

    await this.prisma.wellnessSurvey.delete({ where: { id } })
    return { message: 'Wellness survey deleted' }
  }

  async getAthleteTrend(athleteId: string, orgId: string, days = 14) {
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    const surveys = await this.prisma.wellnessSurvey.findMany({
      where: {
        athleteId,
        orgId,
        surveyDate: { gte: dateFrom },
      },
      orderBy: { surveyDate: 'asc' },
      select: {
        surveyDate: true,
        wellnessScore: true,
        sleepQuality: true,
        fatigueLevel: true,
        mood: true,
        stressLevel: true,
        muscleSoreness: true,
      },
    })

    return surveys.map((s) => ({
      date: s.surveyDate.toISOString().split('T')[0],
      wellnessScore: s.wellnessScore,
      sleepQuality: s.sleepQuality,
      fatigueLevel: s.fatigueLevel,
      mood: s.mood,
      stressLevel: s.stressLevel,
      muscleSoreness: s.muscleSoreness,
    }))
  }

  async getTeamAverage(orgId: string, dateFrom?: string, dateTo?: string) {
    const where: any = { orgId }

    if (dateFrom || dateTo) {
      where.surveyDate = {}
      if (dateFrom) where.surveyDate.gte = new Date(dateFrom)
      if (dateTo) where.surveyDate.lte = new Date(dateTo)
    }

    const surveys = await this.prisma.wellnessSurvey.findMany({
      where,
      select: {
        surveyDate: true,
        wellnessScore: true,
        sleepQuality: true,
        fatigueLevel: true,
        mood: true,
        stressLevel: true,
        muscleSoreness: true,
        hydration: true,
        nutrition: true,
      },
    })

    // Group by date
    const byDate = surveys.reduce((acc: any, survey) => {
      const date = survey.surveyDate.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          count: 0,
          wellnessScore: 0,
          sleepQuality: 0,
          fatigueLevel: 0,
          mood: 0,
          stressLevel: 0,
          muscleSoreness: 0,
          hydration: 0,
          nutrition: 0,
        }
      }
      acc[date].count++
      if (survey.wellnessScore) acc[date].wellnessScore += survey.wellnessScore
      if (survey.sleepQuality) acc[date].sleepQuality += survey.sleepQuality
      if (survey.fatigueLevel) acc[date].fatigueLevel += survey.fatigueLevel
      if (survey.mood) acc[date].mood += survey.mood
      if (survey.stressLevel) acc[date].stressLevel += survey.stressLevel
      if (survey.muscleSoreness) acc[date].muscleSoreness += survey.muscleSoreness
      if (survey.hydration) acc[date].hydration += survey.hydration
      if (survey.nutrition) acc[date].nutrition += survey.nutrition
      return acc
    }, {})

    return Object.entries(byDate).map(([date, data]: [string, any]) => ({
      date,
      responseCount: data.count,
      wellnessScore: data.count > 0 ? parseFloat((data.wellnessScore / data.count).toFixed(2)) : null,
      sleepQuality: data.count > 0 ? parseFloat((data.sleepQuality / data.count).toFixed(2)) : null,
      fatigueLevel: data.count > 0 ? parseFloat((data.fatigueLevel / data.count).toFixed(2)) : null,
      mood: data.count > 0 ? parseFloat((data.mood / data.count).toFixed(2)) : null,
      stressLevel: data.count > 0 ? parseFloat((data.stressLevel / data.count).toFixed(2)) : null,
      muscleSoreness: data.count > 0 ? parseFloat((data.muscleSoreness / data.count).toFixed(2)) : null,
    })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
}
