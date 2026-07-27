/** Targeted tests for a few remaining conditional branches. */
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common'

jest.mock('argon2', () => ({ hash: jest.fn().mockResolvedValue('hashed'), verify: jest.fn().mockResolvedValue(true) }))
jest.mock('speakeasy', () => ({ generateSecret: jest.fn(), totp: { verify: jest.fn().mockReturnValue(false) } }))

import { AuthService } from '../auth/auth.service'
import { AlertsService } from '../alerts/alerts.service'
import { InjuriesService } from '../injuries/injuries.service'
import { JwtStrategy } from '../auth/strategies/jwt.strategy'

const jwt = { sign: jest.fn().mockReturnValue('t') }
const config = { get: jest.fn().mockReturnValue('secret') }

describe('branch coverage extras', () => {
  it('login rejects a PENDING_VERIFICATION account', async () => {
    const prisma: any = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u1', password: 'h', status: 'PENDING_VERIFICATION', mfaStatus: 'DISABLED', organizations: [],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    }
    const svc = new AuthService(prisma, jwt as any, config as any)
    await expect(svc.login({ email: 'a', password: 'p' } as any)).rejects.toThrow(ForbiddenException)
  })

  it('verifyAndEnableMfa rejects an invalid code', async () => {
    const prisma: any = { user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1', mfaSecret: 'S' }), update: jest.fn() } }
    const svc = new AuthService(prisma, jwt as any, config as any)
    await expect(svc.verifyAndEnableMfa('u1', { code: '000000' } as any)).rejects.toThrow(BadRequestException)
  })

  it('disableMfa throws when the user is missing', async () => {
    const prisma: any = { user: { findUnique: jest.fn().mockResolvedValue(null) } }
    const svc = new AuthService(prisma, jwt as any, config as any)
    await expect(svc.disableMfa('u1', 'pw')).rejects.toThrow(UnauthorizedException)
  })

  it('JwtStrategy rejects an unknown user', async () => {
    const prisma: any = { user: { findUnique: jest.fn().mockResolvedValue(null) } }
    const strat = new JwtStrategy(config as any, prisma)
    await expect(strat.validate({ sub: 'ghost' })).rejects.toThrow(UnauthorizedException)
  })

  it('AlertsService.generateForOrg defaults to today and works without an audit sink', async () => {
    const prisma: any = {
      athleteLoadCalculation: {
        findMany: jest.fn().mockResolvedValue([
          { athleteId: 'a1', acwr: 1.9, riskLevel: 'VERY_HIGH', athlete: { firstName: 'A', lastName: 'B' } },
        ]),
      },
      alert: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'al1' }) },
    }
    const calc: any = {
      calculateAllAthletes: jest.fn().mockResolvedValue([]),
      getAlgorithmConfig: jest.fn().mockResolvedValue({ moderateThreshold: 1.3, highThreshold: 1.5 }),
    }
    const svc = new AlertsService(prisma, calc) // no audit
    const res = await svc.generateForOrg('org') // no targetDate
    expect(res.created).toBe(1)
  })

  it('InjuriesService.create works without an audit sink', async () => {
    const prisma: any = {
      injury: { create: jest.fn().mockResolvedValue({ id: 'i1', severity: 'MINOR', bodyPart: 'Knee' }) },
      athlete: { update: jest.fn().mockResolvedValue({}) },
    }
    const svc = new InjuriesService(prisma) // no audit
    await svc.create('org', { athleteId: 'a1', bodyPart: 'Knee', onsetDate: '2026-07-01' } as any)
    expect(prisma.athlete.update).toHaveBeenCalled()
  })
})
