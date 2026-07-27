import { InjuriesService } from '../injuries.service'
import { InjurySeverity } from '@prisma/client'

describe('InjuriesService.classifySeverity', () => {
  it('classifies MINOR for fewer than 7 days lost', () => {
    expect(InjuriesService.classifySeverity(0)).toBe(InjurySeverity.MINOR)
    expect(InjuriesService.classifySeverity(6)).toBe(InjurySeverity.MINOR)
  })

  it('classifies MODERATE for 7 to 28 days lost (inclusive)', () => {
    expect(InjuriesService.classifySeverity(7)).toBe(InjurySeverity.MODERATE)
    expect(InjuriesService.classifySeverity(28)).toBe(InjurySeverity.MODERATE)
  })

  it('classifies SEVERE for more than 28 days lost', () => {
    expect(InjuriesService.classifySeverity(29)).toBe(InjurySeverity.SEVERE)
    expect(InjuriesService.classifySeverity(120)).toBe(InjurySeverity.SEVERE)
  })
})

describe('InjuriesService.getStats', () => {
  it('aggregates counts, days lost, and currently-out total', async () => {
    const prisma: any = {
      injury: {
        findMany: jest.fn().mockResolvedValue([
          { status: 'OPEN', severity: 'MODERATE', daysLost: 10 },
          { status: 'RECOVERING', severity: 'MINOR', daysLost: 3 },
          { status: 'RESOLVED', severity: 'SEVERE', daysLost: 40 },
        ]),
      },
    }
    const service = new InjuriesService(prisma)
    const stats = await service.getStats('org-1')

    expect(stats.total).toBe(3)
    expect(stats.currentlyOut).toBe(2) // OPEN + RECOVERING
    expect(stats.totalDaysLost).toBe(53)
    expect(stats.byStatus.OPEN).toBe(1)
    expect(stats.bySeverity.SEVERE).toBe(1)
  })
})
