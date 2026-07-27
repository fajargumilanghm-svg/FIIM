import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Role, AthleteStatus } from '@prisma/client'
import { CreateAthleteDto, UpdateAthleteDto } from './dto/athletes.dto'

@Injectable()
export class AthletesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, currentUser: any, filters?: { status?: string; sportId?: string; search?: string }) {
    // RBAC check
    if (!this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST])) {
      throw new ForbiddenException('Insufficient permissions')
    }

    const where: any = {
      orgId,
      deletedAt: null,
    }

    if (filters?.status) {
      where.status = filters.status as AthleteStatus
    }

    if (filters?.sportId) {
      where.sportId = filters.sportId
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const athletes = await this.prisma.athlete.findMany({
      where,
      include: {
        sport: { select: { id: true, name: true } },
        position: { select: { id: true, name: true, abbreviation: true } },
        teams: {
          include: {
            team: { select: { id: true, name: true, category: true } },
          },
        },
      },
      orderBy: { lastName: 'asc' },
    })

    return athletes
  }

  async findOne(id: string, orgId: string, currentUser: any) {
    // Medical staff can view all; coaches view active; others restricted
    const athlete = await this.prisma.athlete.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        sport: true,
        position: true,
        teams: {
          include: {
            team: true,
          },
        },
      },
    })

    if (!athlete) {
      throw new NotFoundException('Athlete not found')
    }

    // Field-level access control for medical data
    const isMedicalStaff = this.hasPermission(currentUser.role, [Role.MEDICAL_STAFF, Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN])
    
    if (!isMedicalStaff) {
      // Strip medical fields for non-medical staff
      const { bloodType, allergies, medications, medicalNotes, ...safeAthlete } = athlete as any
      return safeAthlete
    }

    return athlete
  }

  async create(createDto: CreateAthleteDto, orgId: string, currentUser: any) {
    if (!this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH])) {
      throw new ForbiddenException('Insufficient permissions')
    }

    // Check for duplicate email within org
    if (createDto.email) {
      const existing = await this.prisma.athlete.findFirst({
        where: { orgId, email: createDto.email, deletedAt: null },
      })
      if (existing) {
        throw new BadRequestException('Email already used by another athlete')
      }
    }

    const athlete = await this.prisma.athlete.create({
      data: {
        orgId,
        ...createDto,
        dateOfBirth: createDto.dateOfBirth ? new Date(createDto.dateOfBirth) : null,
        joinedDate: createDto.joinedDate ? new Date(createDto.joinedDate) : null,
        contractEnd: createDto.contractEnd ? new Date(createDto.contractEnd) : null,
      },
      include: {
        sport: true,
        position: true,
      },
    })

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        orgId,
        userId: currentUser.sub,
        action: 'CREATE',
        entityType: 'athlete',
        entityId: athlete.id,
        description: `Athlete ${athlete.firstName} ${athlete.lastName} created`,
        containsMedicalData: !!(createDto.allergies || createDto.medications || createDto.medicalNotes),
      },
    })

    return athlete
  }

  async update(id: string, updateDto: UpdateAthleteDto, orgId: string, currentUser: any) {
    if (!this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF])) {
      throw new ForbiddenException('Insufficient permissions')
    }

    // Medical staff can only update medical fields
    if (this.hasPermission(currentUser.role, [Role.MEDICAL_STAFF]) && 
        !this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH])) {
      const allowedFields = ['bloodType', 'allergies', 'medications', 'medicalNotes', 'injuryStatus', 'returnToPlayDate', 'status']
      const attemptedFields = Object.keys(updateDto)
      const hasNonMedical = attemptedFields.some(f => !allowedFields.includes(f))
      if (hasNonMedical) {
        throw new ForbiddenException('Medical staff can only update medical fields')
      }
    }

    const existing = await this.prisma.athlete.findFirst({
      where: { id, orgId, deletedAt: null },
    })

    if (!existing) {
      throw new NotFoundException('Athlete not found')
    }

    const athlete = await this.prisma.athlete.update({
      where: { id },
      data: {
        ...updateDto,
        dateOfBirth: updateDto.dateOfBirth ? new Date(updateDto.dateOfBirth) : undefined,
        joinedDate: updateDto.joinedDate ? new Date(updateDto.joinedDate) : undefined,
        contractEnd: updateDto.contractEnd ? new Date(updateDto.contractEnd) : undefined,
        returnToPlayDate: updateDto.returnToPlayDate ? new Date(updateDto.returnToPlayDate) : undefined,
        updatedAt: new Date(),
      },
      include: {
        sport: true,
        position: true,
      },
    })

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        orgId,
        userId: currentUser.sub,
        action: 'UPDATE',
        entityType: 'athlete',
        entityId: athlete.id,
        description: `Athlete ${athlete.firstName} ${athlete.lastName} updated`,
        oldValues: existing,
        newValues: athlete,
        containsMedicalData: !!((updateDto as any).allergies || (updateDto as any).medications || (updateDto as any).medicalNotes || updateDto.injuryStatus),
      },
    })

    return athlete
  }

  async remove(id: string, orgId: string, currentUser: any) {
    if (!this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN])) {
      throw new ForbiddenException('Only admins can remove athletes')
    }

    const athlete = await this.prisma.athlete.findFirst({
      where: { id, orgId, deletedAt: null },
    })

    if (!athlete) {
      throw new NotFoundException('Athlete not found')
    }

    await this.prisma.athlete.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: AthleteStatus.RETIRED,
        email: athlete.email ? `deleted_${athlete.email}_${Date.now()}` : null,
      },
    })

    await this.prisma.auditLog.create({
      data: {
        orgId,
        userId: currentUser.sub,
        action: 'DELETE',
        entityType: 'athlete',
        entityId: id,
        description: `Athlete ${athlete.firstName} ${athlete.lastName} removed`,
      },
    })

    return { message: 'Athlete removed successfully' }
  }

  async getStats(orgId: string, currentUser: any) {
    if (!this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF, Role.ANALYST])) {
      throw new ForbiddenException('Insufficient permissions')
    }

    const [total, active, injured, returning, bySport] = await Promise.all([
      this.prisma.athlete.count({ where: { orgId, deletedAt: null } }),
      this.prisma.athlete.count({ where: { orgId, status: AthleteStatus.ACTIVE, deletedAt: null } }),
      this.prisma.athlete.count({ where: { orgId, status: AthleteStatus.INJURED, deletedAt: null } }),
      this.prisma.athlete.count({ where: { orgId, status: AthleteStatus.RETURNING_TO_PLAY, deletedAt: null } }),
      this.prisma.sport.findMany({
        where: { orgId },
        include: {
          _count: {
            select: { athletes: { where: { deletedAt: null } } },
          },
        },
      }),
    ])

    return {
      total,
      active,
      injured,
      returning,
      bySport: bySport.map(s => ({ id: s.id, name: s.name, count: s._count.athletes })),
    }
  }

  private hasPermission(userRole: Role, allowedRoles: Role[]): boolean {
    return allowedRoles.includes(userRole)
  }
}
