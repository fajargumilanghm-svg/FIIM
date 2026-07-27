import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateTrainingSessionDto, UpdateTrainingSessionDto, CreateAthleteSessionLoadDto } from './dto/training-load.dto'

@Injectable()
export class TrainingLoadService {
  constructor(private prisma: PrismaService) {}

  async findAllSessions(orgId: string, filters?: { dateFrom?: string; dateTo?: string; teamId?: string }) {
    const where: any = { orgId, deletedAt: null }

    if (filters?.teamId) where.teamId = filters.teamId
    if (filters?.dateFrom || filters?.dateTo) {
      where.scheduledDate = {}
      if (filters.dateFrom) where.scheduledDate.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.scheduledDate.lte = new Date(filters.dateTo)
    }

    return this.prisma.trainingSession.findMany({
      where,
      include: {
        sport: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        athleteLoads: {
          include: {
            athlete: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    })
  }

  async findSessionById(id: string, orgId: string) {
    const session = await this.prisma.trainingSession.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        sport: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        athleteLoads: {
          include: {
            athlete: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
          },
        },
      },
    })

    if (!session) throw new NotFoundException('Training session not found')
    return session
  }

  async createSession(orgId: string, data: CreateTrainingSessionDto) {
    return this.prisma.trainingSession.create({
      data: {
        orgId,
        name: data.name,
        description: data.description,
        sessionType: data.sessionType || 'TRAINING',
        scheduledDate: new Date(data.scheduledDate),
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        durationMinutes: data.durationMinutes,
        sportId: data.sportId,
        teamId: data.teamId,
        location: data.location,
        plannedRpe: data.plannedRpe,
        plannedLoad: data.plannedLoad,
        status: 'SCHEDULED',
      },
      include: {
        sport: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    })
  }

  async updateSession(id: string, orgId: string, data: UpdateTrainingSessionDto) {
    const existing = await this.prisma.trainingSession.findFirst({ where: { id, orgId, deletedAt: null } })
    if (!existing) throw new NotFoundException('Training session not found')

    return this.prisma.trainingSession.update({
      where: { id },
      data: {
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        updatedAt: new Date(),
      },
    })
  }

  async deleteSession(id: string, orgId: string) {
    const existing = await this.prisma.trainingSession.findFirst({ where: { id, orgId, deletedAt: null } })
    if (!existing) throw new NotFoundException('Training session not found')

    await this.prisma.trainingSession.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    })
    return { message: 'Training session deleted' }
  }

  async addAthleteLoad(sessionId: string, orgId: string, data: CreateAthleteSessionLoadDto) {
    const session = await this.prisma.trainingSession.findFirst({
      where: { id: sessionId, orgId },
    })
    if (!session) throw new NotFoundException('Training session not found')

    const totalLoad = data.rpeScore && data.durationMinutes
      ? data.rpeScore * data.durationMinutes
      : null

    return this.prisma.athleteSessionLoad.create({
      data: {
        sessionId,
        athleteId: data.athleteId,
        orgId,
        rpeScore: data.rpeScore,
        durationMinutes: data.durationMinutes,
        totalLoad,
        distanceMeters: data.distanceMeters,
        highSpeedDistance: data.highSpeedDistance,
        sprintDistance: data.sprintDistance,
        accelerations: data.accelerations,
        decelerations: data.decelerations,
        heartRateAvg: data.heartRateAvg,
        heartRateMax: data.heartRateMax,
        wellnessPre: data.wellnessPre,
        wellnessPost: data.wellnessPost,
        notes: data.notes,
      },
      include: {
        athlete: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  }

  async getAthleteLoadHistory(athleteId: string, orgId: string, days = 30) {
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    return this.prisma.athleteSessionLoad.findMany({
      where: {
        athleteId,
        orgId,
        createdAt: { gte: dateFrom },
      },
      include: {
        session: {
          select: {
            name: true,
            sessionType: true,
            scheduledDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
