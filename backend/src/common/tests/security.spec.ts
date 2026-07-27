import { UnauthorizedException } from '@nestjs/common'
import { Role } from '@prisma/client'
import { RolesGuard } from '../guards/roles.guard'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { JwtStrategy } from '../../modules/auth/strategies/jwt.strategy'
import { LocalStrategy } from '../../modules/auth/strategies/local.strategy'

function ctx(user: any) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any
}

describe('RolesGuard', () => {
  const guard = (roles: Role[] | undefined) =>
    new RolesGuard({ getAllAndOverride: jest.fn().mockReturnValue(roles) } as any)

  it('allows when no roles are required', () => {
    expect(guard(undefined).canActivate(ctx({ role: Role.ATHLETE }))).toBe(true)
  })

  it('denies when there is no authenticated user', () => {
    expect(guard([Role.COACH]).canActivate(ctx(null))).toBe(false)
  })

  it('always allows SUPER_ADMIN and ORGANIZATION_ADMIN', () => {
    expect(guard([Role.COACH]).canActivate(ctx({ role: Role.SUPER_ADMIN }))).toBe(true)
    expect(guard([Role.COACH]).canActivate(ctx({ role: Role.ORGANIZATION_ADMIN }))).toBe(true)
  })

  it('allows a matching role and denies a non-matching one', () => {
    expect(guard([Role.COACH]).canActivate(ctx({ role: Role.COACH }))).toBe(true)
    expect(guard([Role.COACH]).canActivate(ctx({ role: Role.ANALYST }))).toBe(false)
  })
})

describe('JwtAuthGuard', () => {
  it('bypasses auth for @Public routes', () => {
    const guard = new JwtAuthGuard({ getAllAndOverride: jest.fn().mockReturnValue(true) } as any)
    expect(guard.canActivate(ctx(null))).toBe(true)
  })
})

describe('JwtStrategy.validate', () => {
  const config = { get: jest.fn().mockReturnValue('secret') }

  it('rejects a suspended user', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1', status: 'SUSPENDED', organizations: [] }) } }
    const strat = new JwtStrategy(config as any, prisma as any)
    await expect(strat.validate({ sub: 'u1' })).rejects.toThrow(UnauthorizedException)
  })

  it('strips sensitive fields and attaches org/role from the payload', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u1',
          status: 'ACTIVE',
          password: 'x',
          mfaSecret: 's',
          mfaBackupCodes: [],
          firstName: 'A',
          organizations: [],
        }),
      },
    }
    const strat = new JwtStrategy(config as any, prisma as any)
    const res: any = await strat.validate({ sub: 'u1', orgId: 'org', role: 'COACH' })
    expect(res.password).toBeUndefined()
    expect(res.mfaSecret).toBeUndefined()
    expect(res).toMatchObject({ orgId: 'org', role: 'COACH' })
  })
})

describe('LocalStrategy.validate', () => {
  it('returns the user on valid credentials', async () => {
    const auth = { validateUser: jest.fn().mockResolvedValue({ id: 'u1' }) }
    const strat = new LocalStrategy(auth as any)
    expect(await strat.validate('a@b.c', 'pw')).toEqual({ id: 'u1' })
  })

  it('throws on invalid credentials', async () => {
    const auth = { validateUser: jest.fn().mockResolvedValue(null) }
    const strat = new LocalStrategy(auth as any)
    await expect(strat.validate('a@b.c', 'bad')).rejects.toThrow(UnauthorizedException)
  })
})
