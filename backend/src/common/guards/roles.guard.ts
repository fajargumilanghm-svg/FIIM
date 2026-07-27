import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()
    if (!user || !user.role) {
      return false
    }

    // SUPER_ADMIN can access everything
    if (user.role === Role.SUPER_ADMIN) {
      return true
    }

    // ORGANIZATION_ADMIN can access everything within their org
    if (user.role === Role.ORGANIZATION_ADMIN) {
      return true
    }

    return requiredRoles.some((role) => user.role === role)
  }
}
