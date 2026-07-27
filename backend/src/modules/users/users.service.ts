import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Role } from '@prisma/client'
import * as argon2 from 'argon2'
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto } from './dto/users.dto'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, currentUser: any) {
    // Only admins and coaches can list all users
    if (!this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF])) {
      throw new ForbiddenException('Insufficient permissions')
    }

    return this.prisma.user.findMany({
      where: {
        organizations: {
          some: {
            orgId,
            leftAt: null,
          },
        },
        deletedAt: null,
      },
      include: {
        organizations: {
          where: { orgId, leftAt: null },
          select: { role: true, joinedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string, orgId: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organizations: {
          where: { orgId: orgId || undefined },
          include: { organization: { select: { id: true, name: true, slug: true } } },
        },
      },
    })

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found')
    }

    // Users can view their own profile; others need permission
    if (currentUser.id !== id && !this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN, Role.COACH, Role.MEDICAL_STAFF])) {
      throw new ForbiddenException('Cannot view this user')
    }

    // Remove sensitive fields
    const { password, mfaSecret, mfaBackupCodes, ...safeUser } = user as any
    return safeUser
  }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          where: { leftAt: null },
          include: {
            organization: {
              select: { id: true, name: true, slug: true, logoUrl: true },
            },
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const { password, mfaSecret, mfaBackupCodes, ...safeUser } = user as any
    return safeUser
  }

  async create(createDto: CreateUserDto, currentUser: any) {
    if (!this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN])) {
      throw new ForbiddenException('Only admins can create users')
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    })

    if (existingUser) {
      throw new BadRequestException('Email already registered')
    }

    const passwordHash = await argon2.hash(createDto.password)

    const user = await this.prisma.user.create({
      data: {
        email: createDto.email,
        password: passwordHash,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        displayName: `${createDto.firstName} ${createDto.lastName}`,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    })

    // Add to organization if orgId provided
    if (createDto.orgId) {
      await this.prisma.userOrganization.create({
        data: {
          userId: user.id,
          orgId: createDto.orgId,
          role: createDto.role || Role.ATHLETE,
          isPrimary: true,
        },
      })
    }

    const { password, mfaSecret, mfaBackupCodes, ...safeUser } = user as any
    return safeUser
  }

  async update(id: string, updateDto: UpdateUserDto, currentUser: any) {
    // Users can update their own profile; admins can update anyone
    if (currentUser.id !== id && !this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN])) {
      throw new ForbiddenException('Cannot update this user')
    }

    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found')
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateDto,
        updatedAt: new Date(),
        status: updateDto.status as any,
      },
    })

    const { password, mfaSecret, mfaBackupCodes, ...safeUser } = updatedUser as any
    return safeUser
  }

  async updateRole(id: string, roleDto: UpdateUserRoleDto, currentUser: any) {
    if (!this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN])) {
      throw new ForbiddenException('Only admins can change roles')
    }

    // Prevent self-demotion for super admins
    if (currentUser.id === id && roleDto.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot change your own admin role')
    }

    const userOrg = await this.prisma.userOrganization.findUnique({
      where: { userId_orgId: { userId: id, orgId: roleDto.orgId } },
    })

    if (!userOrg) {
      throw new NotFoundException('User not found in this organization')
    }

    await this.prisma.userOrganization.update({
      where: { userId_orgId: { userId: id, orgId: roleDto.orgId } },
      data: { role: roleDto.role },
    })

    return { message: 'Role updated successfully' }
  }

  async remove(id: string, currentUser: any) {
    if (!this.hasPermission(currentUser.role, [Role.SUPER_ADMIN, Role.ORGANIZATION_ADMIN])) {
      throw new ForbiddenException('Only admins can remove users')
    }

    // Prevent self-deletion
    if (currentUser.id === id) {
      throw new ForbiddenException('Cannot delete your own account')
    }

    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found')
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
        email: `deleted_${user.email}_${Date.now()}`, // Prevent future registration conflicts
      },
    })

    // Remove from all organizations
    await this.prisma.userOrganization.updateMany({
      where: { userId: id },
      data: { leftAt: new Date() },
    })

    return { message: 'User removed successfully' }
  }

  private hasPermission(userRole: Role, allowedRoles: Role[]): boolean {
    return allowedRoles.includes(userRole)
  }
}
