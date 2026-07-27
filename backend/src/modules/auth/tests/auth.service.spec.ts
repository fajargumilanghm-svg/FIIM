import { UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common'

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  verify: jest.fn().mockResolvedValue(true),
}))
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({ base32: 'SECRET32' }),
  totp: { verify: jest.fn().mockReturnValue(true) },
}))

import * as argon2 from 'argon2'
import * as speakeasy from 'speakeasy'
import { AuthService } from '../auth.service'

const jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') }
const config = { get: jest.fn().mockImplementation((_k: string, d?: any) => d ?? 'secret') }

function makePrisma(overrides: any = {}) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: any) => ({ id: 'u1', organizations: [], ...data })),
      update: jest.fn().mockResolvedValue({}),
    },
    organization: { findUnique: jest.fn().mockResolvedValue(null) },
    userOrganization: { create: jest.fn().mockResolvedValue({}) },
    refreshToken: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ token: 'refresh.token' }),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({}),
    },
    ...overrides,
  }
}

const build = (prisma: any) => new AuthService(prisma as any, jwt as any, config as any)

const baseUser = (over: any = {}) => ({
  id: 'u1',
  email: 'a@b.c',
  password: 'hashed',
  firstName: 'A',
  lastName: 'B',
  displayName: 'A B',
  status: 'ACTIVE',
  mfaStatus: 'DISABLED',
  organizations: [{ role: 'COACH', organization: { id: 'org', name: 'FC', slug: 'fc' } }],
  ...over,
})

beforeEach(() => {
  ;(argon2.verify as jest.Mock).mockResolvedValue(true)
  ;(speakeasy.totp.verify as jest.Mock).mockReturnValue(true)
})

describe('AuthService', () => {
  describe('validateUser', () => {
    it('returns null when user or password missing', async () => {
      expect(await build(makePrisma()).validateUser('a@b.c', 'p')).toBeNull()
    })

    it('increments failed attempts and returns null on bad password', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser())
      ;(argon2.verify as jest.Mock).mockResolvedValue(false)
      const res = await build(prisma).validateUser('a@b.c', 'wrong')
      expect(res).toBeNull()
      expect(prisma.user.update.mock.calls[0][0].data.failedLoginAttempts).toEqual({ increment: 1 })
    })

    it('resets attempts and strips password on success', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser())
      const res: any = await build(prisma).validateUser('a@b.c', 'right')
      expect(res.password).toBeUndefined()
      expect(prisma.user.update.mock.calls[0][0].data.failedLoginAttempts).toBe(0)
    })
  })

  describe('login', () => {
    it('rejects invalid credentials', async () => {
      const prisma = makePrisma() // findUnique -> null
      await expect(build(prisma).login({ email: 'a@b.c', password: 'p' } as any)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('rejects suspended accounts', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser({ status: 'SUSPENDED' }))
      await expect(build(prisma).login({ email: 'a@b.c', password: 'p' } as any)).rejects.toThrow(
        ForbiddenException,
      )
    })

    it('demands an MFA code when MFA is enabled', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser({ mfaStatus: 'ENABLED', mfaSecret: 'S' }))
      await expect(build(prisma).login({ email: 'a@b.c', password: 'p' } as any)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('rejects an invalid MFA code', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser({ mfaStatus: 'ENABLED', mfaSecret: 'S' }))
      ;(speakeasy.totp.verify as jest.Mock).mockReturnValue(false)
      await expect(
        build(prisma).login({ email: 'a@b.c', password: 'p', mfaCode: '000000' } as any),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('returns tokens and user context on success', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser())
      const res = await build(prisma).login({ email: 'a@b.c', password: 'p', orgSlug: 'fc' } as any)
      expect(res.accessToken).toBeDefined()
      expect(res.user).toMatchObject({ id: 'u1', role: 'COACH', orgId: 'org' })
    })
  })

  describe('register', () => {
    it('rejects an existing email', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue({ id: 'dup' })
      await expect(
        build(prisma).register({ email: 'a@b.c', password: 'p', firstName: 'A', lastName: 'B' } as any),
      ).rejects.toThrow(BadRequestException)
    })

    it('creates a user and links to an org by slug', async () => {
      const prisma = makePrisma()
      prisma.organization.findUnique.mockResolvedValue({ id: 'org' })
      prisma.userOrganization.create.mockResolvedValue({ role: 'ATHLETE', organization: { id: 'org', name: 'FC' } })
      const res = await build(prisma).register({
        email: 'a@b.c',
        password: 'p',
        firstName: 'A',
        lastName: 'B',
        orgSlug: 'fc',
      } as any)
      expect(argon2.hash).toHaveBeenCalled()
      expect(res.user.orgId).toBe('org')
    })
  })

  describe('refreshToken', () => {
    it('rejects invalid/expired tokens', async () => {
      await expect(build(makePrisma()).refreshToken({ refreshToken: 'x' } as any)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('rotates a valid token', async () => {
      const prisma = makePrisma()
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1e6),
        user: baseUser(),
      })
      const res = await build(prisma).refreshToken({ refreshToken: 'valid' } as any)
      expect(res.accessToken).toBeDefined()
      expect(prisma.refreshToken.update).toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('revokes matching refresh tokens', async () => {
      const prisma = makePrisma()
      await build(prisma).logout('rt', 'u1')
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled()
    })
  })

  describe('setupMfa', () => {
    it('throws when user missing', async () => {
      await expect(build(makePrisma()).setupMfa('u1', {} as any)).rejects.toThrow(UnauthorizedException)
    })

    it('generates a TOTP secret + otpauth URL', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser())
      const res = await build(prisma).setupMfa('u1', { method: 'TOTP' } as any)
      expect(res.secret).toBe('SECRET32')
      expect(res.qrCodeUrl).toContain('otpauth://totp')
    })

    it('rejects unsupported methods', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser())
      await expect(build(prisma).setupMfa('u1', { method: 'SMS' } as any)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('verifyAndEnableMfa', () => {
    it('throws when MFA not initialized', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser({ mfaSecret: null }))
      await expect(build(prisma).verifyAndEnableMfa('u1', { code: '1' } as any)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('enables MFA on a valid code', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser({ mfaSecret: 'S' }))
      await build(prisma).verifyAndEnableMfa('u1', { code: '123456' } as any)
      expect(prisma.user.update.mock.calls[0][0].data.mfaStatus).toBe('ENABLED')
    })
  })

  describe('disableMfa', () => {
    it('rejects an invalid password', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser())
      ;(argon2.verify as jest.Mock).mockResolvedValue(false)
      await expect(build(prisma).disableMfa('u1', 'bad')).rejects.toThrow(UnauthorizedException)
    })

    it('clears MFA fields on success', async () => {
      const prisma = makePrisma()
      prisma.user.findUnique.mockResolvedValue(baseUser())
      await build(prisma).disableMfa('u1', 'good')
      expect(prisma.user.update.mock.calls[0][0].data.mfaStatus).toBe('DISABLED')
    })
  })
})
