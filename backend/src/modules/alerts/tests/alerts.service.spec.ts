import { AlertsService } from '../alerts.service'

/**
 * Unit tests for the alert-generation logic. Prisma and CalculationsService are
 * mocked so these run without a database — the focus is the ACWR → alert mapping.
 */
describe('AlertsService.generateForOrg', () => {
  const orgId = 'org-1'

  function buildService(calcs: any[]) {
    const created: any[] = []
    const updated: any[] = []

    const prisma: any = {
      athleteLoadCalculation: {
        findMany: jest.fn().mockResolvedValue(calcs),
      },
      alert: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => {
          created.push(data)
          return Promise.resolve({ id: `alert-${created.length}`, ...data })
        }),
        update: jest.fn().mockImplementation(({ data }: any) => {
          updated.push(data)
          return Promise.resolve(data)
        }),
      },
    }

    const calculations: any = {
      calculateAllAthletes: jest.fn().mockResolvedValue([]),
      getAlgorithmConfig: jest
        .fn()
        .mockResolvedValue({ moderateThreshold: 1.3, highThreshold: 1.5 }),
    }

    const service = new AlertsService(prisma, calculations)
    return { service, prisma, created, updated }
  }

  const calc = (athleteId: string, riskLevel: string, acwr: number, first = 'A', last = 'B') => ({
    athleteId,
    riskLevel,
    acwr,
    athlete: { firstName: first, lastName: last },
  })

  it('raises a CRITICAL alert for a VERY_HIGH athlete', async () => {
    const { service, created } = buildService([calc('a1', 'VERY_HIGH', 1.9)])
    const result = await service.generateForOrg(orgId, new Date('2026-07-27'))

    expect(result.created).toBe(1)
    expect(created).toHaveLength(1)
    expect(created[0].type).toBe('ACWR_VERY_HIGH')
    expect(created[0].severity).toBe('CRITICAL')
    expect(created[0].threshold).toBe(1.5)
    expect(created[0].metricValue).toBe(1.9)
  })

  it('raises a WARNING alert for a HIGH athlete', async () => {
    const { service, created } = buildService([calc('a2', 'HIGH', 1.4)])
    await service.generateForOrg(orgId, new Date('2026-07-27'))

    expect(created).toHaveLength(1)
    expect(created[0].type).toBe('ACWR_HIGH')
    expect(created[0].severity).toBe('WARNING')
    expect(created[0].threshold).toBe(1.3)
  })

  it('does not raise alerts for MODERATE, LOW, or missing risk levels', async () => {
    const { service, created } = buildService([
      calc('a3', 'MODERATE', 1.1),
      calc('a4', 'LOW', 0.9),
      calc('a5', 'INSUFFICIENT_DATA', 0),
      { athleteId: 'a6', riskLevel: null, acwr: null, athlete: { firstName: 'N', lastName: 'A' } },
    ])
    const result = await service.generateForOrg(orgId, new Date('2026-07-27'))

    expect(result.created).toBe(0)
    expect(created).toHaveLength(0)
  })

  it('is idempotent: refreshes an existing OPEN alert instead of duplicating', async () => {
    const { service, prisma, created, updated } = buildService([calc('a1', 'VERY_HIGH', 1.9)])
    prisma.alert.findUnique.mockResolvedValue({ id: 'existing', status: 'OPEN' })

    const result = await service.generateForOrg(orgId, new Date('2026-07-27'))

    expect(created).toHaveLength(0)
    expect(updated).toHaveLength(1)
    expect(result.updated).toBe(1)
  })

  it('does not reopen an alert a coach already resolved', async () => {
    const { service, prisma, created, updated } = buildService([calc('a1', 'VERY_HIGH', 1.9)])
    prisma.alert.findUnique.mockResolvedValue({ id: 'existing', status: 'RESOLVED' })

    const result = await service.generateForOrg(orgId, new Date('2026-07-27'))

    expect(created).toHaveLength(0)
    expect(updated).toHaveLength(0)
    expect(result.created).toBe(0)
    expect(result.updated).toBe(0)
  })
})
