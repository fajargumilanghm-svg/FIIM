import { AuditService } from '../audit.service'

function makePrisma(overrides: any = {}) {
  return {
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    ...overrides,
  }
}

describe('AuditService', () => {
  describe('log', () => {
    it('writes an entry with defaults applied', async () => {
      const prisma = makePrisma()
      const svc = new AuditService(prisma as any)
      await svc.log({ action: 'CREATE', entityType: 'athlete' })
      const data = prisma.auditLog.create.mock.calls[0][0].data
      expect(data).toMatchObject({ action: 'CREATE', entityType: 'athlete', containsMedicalData: false })
    })

    it('never throws even if the write fails (best-effort)', async () => {
      const prisma = makePrisma()
      prisma.auditLog.create.mockRejectedValue(new Error('db down'))
      const svc = new AuditService(prisma as any)
      await expect(svc.log({ action: 'LOGIN', entityType: 'user' })).resolves.toBeUndefined()
    })
  })

  describe('findAll', () => {
    it('applies filters and returns pagination envelope', async () => {
      const prisma = makePrisma()
      prisma.auditLog.count.mockResolvedValue(42)
      prisma.auditLog.findMany.mockResolvedValue([{ id: 'l1' }])
      const svc = new AuditService(prisma as any)
      const res = await svc.findAll('org', { action: 'EXPORT', entityType: 'report', limit: 25, offset: 5 })
      expect(res).toMatchObject({ total: 42, limit: 25, offset: 5 })
      const args = prisma.auditLog.findMany.mock.calls[0][0]
      expect(args.where).toMatchObject({ orgId: 'org', action: 'EXPORT', entityType: 'report' })
      expect(args.take).toBe(25)
      expect(args.skip).toBe(5)
    })

    it('defaults limit/offset', async () => {
      const prisma = makePrisma()
      const svc = new AuditService(prisma as any)
      const res = await svc.findAll('org')
      expect(res.limit).toBe(50)
      expect(res.offset).toBe(0)
    })
  })

  describe('getStats', () => {
    it('reduces groupBy into an action map + total', async () => {
      const prisma = makePrisma()
      prisma.auditLog.groupBy.mockResolvedValue([
        { action: 'CREATE', _count: { action: 4 } },
        { action: 'EXPORT', _count: { action: 2 } },
      ])
      const svc = new AuditService(prisma as any)
      const res = await svc.getStats('org')
      expect(res.total).toBe(6)
      expect(res.byAction).toEqual({ CREATE: 4, EXPORT: 2 })
    })
  })
})
