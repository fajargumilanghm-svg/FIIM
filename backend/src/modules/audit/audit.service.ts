import { Injectable, Logger } from '@nestjs/common'
import { AuditAction, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditQueryDto } from './dto/audit.dto'

export interface AuditEntry {
  orgId?: string | null
  userId?: string | null
  action: AuditAction
  entityType: string
  entityId?: string | null
  description?: string
  newValues?: Prisma.InputJsonValue
  oldValues?: Prisma.InputJsonValue
  containsMedicalData?: boolean
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Record an audit entry. Best-effort: an audit write must never break the
   * business operation that triggered it, so failures are swallowed + logged.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          orgId: entry.orgId ?? null,
          userId: entry.userId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          description: entry.description,
          newValues: entry.newValues,
          oldValues: entry.oldValues,
          containsMedicalData: entry.containsMedicalData ?? false,
        },
      })
    } catch (err) {
      this.logger.warn(`Failed to write audit log: ${err instanceof Error ? err.message : err}`)
    }
  }

  async findAll(orgId: string, query: AuditQueryDto = {}) {
    const where: Prisma.AuditLogWhereInput = { orgId }
    if (query.action) where.action = query.action
    if (query.entityType) where.entityType = query.entityType
    if (query.userId) where.userId = query.userId

    const take = query.limit ?? 50
    const skip = query.offset ?? 0

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
    ])

    return { total, limit: take, offset: skip, items }
  }

  async getStats(orgId: string) {
    const grouped = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where: { orgId },
      _count: { action: true },
    })

    const byAction: Record<string, number> = {}
    let total = 0
    for (const g of grouped) {
      byAction[g.action] = g._count.action
      total += g._count.action
    }

    return { total, byAction }
  }
}
