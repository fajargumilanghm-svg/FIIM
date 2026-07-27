import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { Role } from '@prisma/client'

jest.mock('argon2', () => ({ hash: jest.fn().mockResolvedValue('hashed') }))

import { UsersService } from '../users.service'

const admin = { id: 'admin', role: Role.ORGANIZATION_ADMIN }
const coach = { id: 'coach', role: Role.COACH }
const athlete = { id: 'ath', role: Role.ATHLETE }

function makePrisma(overrides: any = {}) {
  return {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: any) => ({ id: 'u1', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => ({ id: 'u1', ...data })),
    },
    userOrganization: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({}),
    },
    ...overrides,
  }
}

describe('UsersService', () => {
  describe('findAll', () => {
    it('rejects unauthorized roles', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(svc.findAll('org', athlete)).rejects.toThrow(ForbiddenException)
    })
    it('lists users for authorized roles', async () => {
      const prisma = makePrisma()
      prisma.user.findMany.mockResolvedValue([{ id: 'u1' }])
      const svc = new UsersService(prisma as any)
      expect(await svc.findAll('org', coach)).toEqual([{ id: 'u1' }])
    })
  })

  describe('findOne', () => {
    it('throws when missing or deleted', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', deletedAt: new Date() })
      const svc = new UsersService(prisma as any)
      await expect(svc.findOne('u1', 'org', admin)).rejects.toThrow(NotFoundException)
    })
    it('blocks viewing another user without permission', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' })
      const svc = new UsersService(prisma as any)
      await expect(svc.findOne('u1', 'org', athlete)).rejects.toThrow(ForbiddenException)
    })
    it('strips sensitive fields', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue({ id: 'ath', password: 'x', mfaSecret: 's', firstName: 'A' })
      const svc = new UsersService(prisma as any)
      const res: any = await svc.findOne('ath', 'org', athlete) // own profile
      expect(res.password).toBeUndefined()
      expect(res.mfaSecret).toBeUndefined()
    })
  })

  describe('findMe', () => {
    it('throws when missing', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(svc.findMe('u1')).rejects.toThrow(NotFoundException)
    })
    it('returns a sanitized profile', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: 'x', firstName: 'A' })
      const svc = new UsersService(prisma as any)
      const res: any = await svc.findMe('u1')
      expect(res.password).toBeUndefined()
    })
  })

  describe('create', () => {
    it('only admins can create', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(svc.create({ email: 'a@b.c' } as any, coach)).rejects.toThrow(ForbiddenException)
    })
    it('rejects duplicate email', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue({ id: 'dup' })
      const svc = new UsersService(prisma as any)
      await expect(svc.create({ email: 'a@b.c', password: 'p' } as any, admin)).rejects.toThrow(
        BadRequestException,
      )
    })
    it('hashes the password and links to an org', async () => {
      const prisma = makePrisma()
      const svc = new UsersService(prisma as any)
      const res: any = await svc.create(
        { email: 'a@b.c', password: 'p', firstName: 'A', lastName: 'B', orgId: 'org', role: Role.COACH } as any,
        admin,
      )
      expect(res.password).toBeUndefined()
      expect(prisma.user.create.mock.calls[0][0].data.password).toBe('hashed')
      expect(prisma.userOrganization.create).toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('blocks updating another user without admin', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(svc.update('other', {} as any, athlete)).rejects.toThrow(ForbiddenException)
    })
    it('throws when the user is missing', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(svc.update('ath', {} as any, athlete)).rejects.toThrow(NotFoundException)
    })
    it('updates own profile', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue({ id: 'ath' })
      const svc = new UsersService(prisma as any)
      const res: any = await svc.update('ath', { firstName: 'New' } as any, athlete)
      expect(res.password).toBeUndefined()
    })
  })

  describe('updateRole', () => {
    it('only admins', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(svc.updateRole('u1', { orgId: 'org', role: Role.COACH } as any, coach)).rejects.toThrow(
        ForbiddenException,
      )
    })
    it('prevents self-demotion', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(
        svc.updateRole('admin', { orgId: 'org', role: Role.COACH } as any, admin),
      ).rejects.toThrow(ForbiddenException)
    })
    it('throws when membership missing', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(
        svc.updateRole('u1', { orgId: 'org', role: Role.COACH } as any, admin),
      ).rejects.toThrow(NotFoundException)
    })
    it('updates the role', async () => {
      const prisma = makePrisma()
      prisma.userOrganization.findUnique.mockResolvedValue({ userId: 'u1', orgId: 'org' })
      const svc = new UsersService(prisma as any)
      const res = await svc.updateRole('u1', { orgId: 'org', role: Role.COACH } as any, admin)
      expect(res.message).toMatch(/updated/i)
    })
  })

  describe('remove', () => {
    it('only admins', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(svc.remove('u1', coach)).rejects.toThrow(ForbiddenException)
    })
    it('prevents self-deletion', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(svc.remove('admin', admin)).rejects.toThrow(ForbiddenException)
    })
    it('throws when missing', async () => {
      const svc = new UsersService(makePrisma() as any)
      await expect(svc.remove('u1', admin)).rejects.toThrow(NotFoundException)
    })
    it('soft-deletes and detaches memberships', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'e@x.z' })
      const svc = new UsersService(prisma as any)
      const res = await svc.remove('u1', admin)
      expect(res.message).toMatch(/removed/i)
      expect(prisma.user.update.mock.calls[0][0].data.email).toContain('deleted_')
      expect(prisma.userOrganization.updateMany).toHaveBeenCalled()
    })
  })
})
