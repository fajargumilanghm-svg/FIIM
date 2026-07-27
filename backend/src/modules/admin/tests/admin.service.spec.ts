import { NotFoundException } from '@nestjs/common'
import { AdminService } from '../admin.service'

function makePrisma(overrides: any = {}) {
  return {
    userOrganization: { groupBy: jest.fn().mockResolvedValue([]) },
    athlete: { groupBy: jest.fn().mockResolvedValue([]) },
    team: { count: jest.fn().mockResolvedValue(0) },
    sport: { count: jest.fn().mockResolvedValue(0) },
    injury: { count: jest.fn().mockResolvedValue(0) },
    alert: { count: jest.fn().mockResolvedValue(0) },
    wellnessSurvey: { count: jest.fn().mockResolvedValue(0) },
    trainingSession: { count: jest.fn().mockResolvedValue(0) },
    organization: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockImplementation(({ data }: any) => ({ id: 'org', ...data })),
    },
    ...overrides,
  }
}

describe('AdminService', () => {
  describe('getOverview', () => {
    it('aggregates users-by-role and athletes-by-status', async () => {
      const prisma = makePrisma()
      prisma.userOrganization.groupBy.mockResolvedValue([
        { role: 'COACH', _count: { role: 3 } },
        { role: 'ATHLETE', _count: { role: 10 } },
      ])
      prisma.athlete.groupBy.mockResolvedValue([{ status: 'ACTIVE', _count: { status: 8 } }])
      prisma.team.count.mockResolvedValue(2)
      const audit = { log: jest.fn() }
      const svc = new AdminService(prisma as any, audit as any)
      const res = await svc.getOverview('org')
      expect(res.users.total).toBe(13)
      expect(res.users.byRole.COACH).toBe(3)
      expect(res.athletes.total).toBe(8)
      expect(res.teams).toBe(2)
    })
  })

  describe('getOrganization', () => {
    it('throws when missing', async () => {
      const svc = new AdminService(makePrisma() as any)
      await expect(svc.getOrganization('org')).rejects.toThrow(NotFoundException)
    })

    it('returns the org', async () => {
      const prisma = makePrisma()
      prisma.organization.findUnique.mockResolvedValue({ id: 'org', name: 'FC' })
      const svc = new AdminService(prisma as any)
      expect(await svc.getOrganization('org')).toMatchObject({ name: 'FC' })
    })
  })

  describe('updateOrganization', () => {
    it('throws when missing', async () => {
      const svc = new AdminService(makePrisma() as any)
      await expect(svc.updateOrganization('org', { name: 'X' })).rejects.toThrow(NotFoundException)
    })

    it('updates and writes a CONFIG_CHANGED audit entry', async () => {
      const prisma = makePrisma()
      prisma.organization.findUnique.mockResolvedValue({ id: 'org' })
      const audit = { log: jest.fn() }
      const svc = new AdminService(prisma as any, audit as any)
      await svc.updateOrganization('org', { name: 'New', gdprEnabled: true }, 'u1')
      expect(prisma.organization.update).toHaveBeenCalled()
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CONFIG_CHANGED' }))
    })
  })
})
