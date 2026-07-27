import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import * as argon2 from 'argon2'
import * as speakeasy from 'speakeasy'
import { LoginDto, RegisterDto, RefreshTokenDto, SetupMfaDto, VerifyMfaDto, AuthResponseDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organizations: {
          include: { organization: true },
          where: { leftAt: null },
        },
      },
    })

    if (!user || !user.password) {
      return null
    }

    const isValid = await argon2.verify(user.password, password)
    if (!isValid) {
      // Increment failed attempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      })
      return null
    }

    // Reset failed attempts and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    })

    const { password: _, ...result } = user
    return result
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Account is suspended')
    }
    if (user.status === 'PENDING_VERIFICATION') {
      throw new ForbiddenException('Email verification required')
    }

    // Determine organization context
    let orgContext = user.organizations[0]
    if (loginDto.orgSlug) {
      orgContext = user.organizations.find(
        (uo: any) => uo.organization.slug === loginDto.orgSlug,
      )
    }

    // MFA check
    if (user.mfaStatus === 'ENABLED' || user.mfaStatus === 'ENFORCED') {
      if (!loginDto.mfaCode) {
        throw new UnauthorizedException({
          message: 'MFA required',
          mfaRequired: true,
          userId: user.id,
        })
      }

      const isValidMfa = this.verifyMfa(user.mfaSecret, loginDto.mfaCode)
      if (!isValidMfa) {
        throw new UnauthorizedException('Invalid MFA code')
      }
    }

    const tokens = await this.generateTokens(user, orgContext?.organization?.id)

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: orgContext?.role || 'ATHLETE',
        orgId: orgContext?.organization?.id || null,
        orgName: orgContext?.organization?.name || null,
        mfaRequired: user.mfaStatus === 'ENFORCED',
        mfaEnabled: user.mfaStatus === 'ENABLED' || user.mfaStatus === 'ENFORCED',
      },
    }
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    })

    if (existingUser) {
      throw new BadRequestException('Email already registered')
    }

    const passwordHash = await argon2.hash(registerDto.password)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        displayName: `${registerDto.firstName} ${registerDto.lastName}`,
        status: 'ACTIVE', // Auto-activate for dev; production: PENDING_VERIFICATION
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      include: {
        organizations: {
          include: { organization: true },
        },
      },
    })

    // If orgSlug provided, add to organization
    let orgContext = null
    if (registerDto.orgSlug) {
      const org = await this.prisma.organization.findUnique({
        where: { slug: registerDto.orgSlug },
      })

      if (org) {
        const userOrg = await this.prisma.userOrganization.create({
          data: {
            userId: user.id,
            orgId: org.id,
            role: 'ATHLETE',
            isPrimary: true,
          },
          include: { organization: true },
        })
        orgContext = userOrg
      }
    }

    const tokens = await this.generateTokens(user, orgContext?.organization?.id)

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: orgContext?.role || 'ATHLETE',
        orgId: orgContext?.organization?.id || null,
        orgName: orgContext?.organization?.name || null,
        mfaRequired: false,
        mfaEnabled: false,
      },
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
      include: {
        user: {
          include: {
            organizations: {
              include: { organization: true },
              where: { leftAt: null },
            },
          },
        },
      },
    })

    if (!refreshTokenRecord || refreshTokenRecord.revokedAt || refreshTokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const user = refreshTokenRecord.user
    const orgContext = user.organizations[0]

    const tokens = await this.generateTokens(user, orgContext?.organization?.id)

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { revokedAt: new Date(), revokedReason: 'Token refreshed' },
    })

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: orgContext?.role || 'ATHLETE',
        orgId: orgContext?.organization?.id || null,
        orgName: orgContext?.organization?.name || null,
        mfaRequired: user.mfaStatus === 'ENFORCED',
        mfaEnabled: user.mfaStatus === 'ENABLED' || user.mfaStatus === 'ENFORCED',
      },
    }
  }

  async logout(refreshToken: string, userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: 'User logout',
      },
    })
  }

  async setupMfa(userId: string, setupDto: SetupMfaDto): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    if (setupDto.method === 'TOTP' || !setupDto.method) {
      const secret = speakeasy.generateSecret({
        name: `FIIM:${user.email}`,
        issuer: this.configService.get('mfa.issuer', 'FIIM'),
      })

      // Store unverified secret temporarily
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaSecret: secret.base32,
          mfaMethod: 'TOTP',
        },
      })

      const qrCodeUrl = `otpauth://totp/FIIM:${user.email}?secret=${secret.base32}&issuer=FIIM`

      return {
        secret: secret.base32,
        qrCodeUrl,
      }
    }

    throw new BadRequestException('MFA method not supported')
  }

  async verifyAndEnableMfa(userId: string, verifyDto: VerifyMfaDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA not initialized')
    }

    const isValid = this.verifyMfa(user.mfaSecret, verifyDto.code)
    if (!isValid) {
      throw new BadRequestException('Invalid MFA code')
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaStatus: 'ENABLED' },
    })
  }

  async disableMfa(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.password) {
      throw new UnauthorizedException('User not found')
    }

    const isValid = await argon2.verify(user.password, password)
    if (!isValid) {
      throw new UnauthorizedException('Invalid password')
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaStatus: 'DISABLED',
        mfaSecret: null,
        mfaMethod: null,
      },
    })
  }

  private verifyMfa(secret: string | null, code: string): boolean {
    if (!secret) return false
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps of drift
    })
  }

  private async generateTokens(user: any, orgId?: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      orgId,
      role: user.organizations?.[0]?.role || 'ATHLETE',
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiration', '4h'),
    })

    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        orgId,
        token: this.jwtService.sign(
          { sub: user.id, type: 'refresh' },
          {
            secret: this.configService.get('jwt.secret'),
            expiresIn: this.configService.get('jwt.refreshExpiration', '7d'),
          },
        ),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: 4 * 60 * 60, // 4 hours in seconds
    }
  }
}
