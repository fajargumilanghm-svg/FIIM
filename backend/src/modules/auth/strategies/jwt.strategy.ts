import { Strategy, ExtractJwt } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          if (req && req.cookies) {
            return req.cookies.access_token
          }
          return null
        },
      ]),
      secretOrKey: configService.get('jwt.secret'),
      ignoreExpiration: false,
    })
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        organizations: {
          include: { organization: true },
          where: { leftAt: null },
        },
      },
    })

    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedException()
    }

    const { password, mfaSecret, mfaBackupCodes, ...safeUser } = user as any
    return {
      ...safeUser,
      orgId: payload.orgId,
      role: payload.role,
    }
  }
}
