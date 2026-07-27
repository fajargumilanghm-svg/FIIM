import { NotFoundException } from '@nestjs/common'
import { AlertsService } from '../alerts.service'

function makePrisma(overrides: any = {}) {
  return {
    alert: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockImplementation(({ data }: any) => ({ id: 'al1', ...data })),
    },
    ...overrides,
  }
}
const calc = { calculateAllAthletes: jest.fn(), getAlgorithmConfig: jest.fn() }

describe('AlertsService read/workflow', () => {
  describe('findAll', () => {
    it('applies status/severity/type/athlete filters', async () => {
      const prisma = makePrisma()
      const svc = new AlertsService(prisma as any, calc as any)
      await svc.findAll('org', { status: 'OPEN', severity: 'CRITICAL', type: 'ACWR_HIGH', athleteId: 'a1' } as any)
      const where = prisma.alert.findMany.mock.calls[0][0].where
      expect(where).toMatchObject({ orgId: 'org', status: 'OPEN', severity: 'CRITICAL', type: 'ACWR_HIGH', athleteId: 'a1' })
    })
  })

  describe('getStats', () => {
    it('returns counts including active = open + acknowledged', async () => {
      const prisma = makePrisma()
      prisma.alert.count
        .mockResolvedValueOnce(4) // open
        .mockResolvedValueOnce(2) // acknowledged
        .mockResolvedValueOnce(6) // resolved
        .mockResolvedValueOnce(1) // critical
        .mockResolvedValueOnce(3) // warning
      const svc = new AlertsService(prisma as any, calc as any)
      const res = await svc.getStats('org')
      expect(res).toMatchObject({ open: 4, acknowledged: 2, resolved: 6, active: 6, critical: 1, warning: 3 })
    })
  })

  describe('acknowledge', () => {
    it('throws when the alert is missing', async () => {
      const svc = new AlertsService(makePrisma() as any, calc as any)
      await expect(svc.acknowledge('al1', 'org', 'u1')).rejects.toThrow(NotFoundException)
    })

    it('sets ACKNOWLEDGED with actor + timestamp', async () => {
      const prisma = makePrisma()
      prisma.alert.findFirst.mockResolvedValue({ id: 'al1' })
      const svc = new AlertsService(prisma as any, calc as any)
      await svc.acknowledge('al1', 'org', 'u1')
      const data = prisma.alert.update.mock.calls[0][0].data
      expect(data.status).toBe('ACKNOWLEDGED')
      expect(data.acknowledgedBy).toBe('u1')
    })
  })

  describe('resolve', () => {
    it('throws when the alert is missing', async () => {
      const svc = new AlertsService(makePrisma() as any, calc as any)
      await expect(svc.resolve('al1', 'org', 'note', 'u1')).rejects.toThrow(NotFoundException)
    })

    it('sets RESOLVED with note + actor', async () => {
      const prisma = makePrisma()
      prisma.alert.findFirst.mockResolvedValue({ id: 'al1' })
      const svc = new AlertsService(prisma as any, calc as any)
      await svc.resolve('al1', 'org', 'healed', 'u1')
      const data = prisma.alert.update.mock.calls[0][0].data
      expect(data.status).toBe('RESOLVED')
      expect(data.resolutionNote).toBe('healed')
    })
  })
})
