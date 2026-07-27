import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AthletesService } from '../athletes.service'

const admin = { role: Role.ORGANIZATION_ADMIN, sub: 'u-admin' }
const coach = { role: Role.COACH, sub: 'u-coach' }
const medical = { role: Role.MEDICAL_STAFF, sub: 'u-med' }
const analyst = { role: Role.ANALYST, sub: 'u-analyst' }

function makePrisma(overrides: any = {}) {
  return {
    athlete: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: any) => ({ id: 'a1', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => ({ id: 'a1', firstName: 'A', lastName: 'B', ...data })),
      count: jest.fn().mockResolvedValue(0),
    },
    sport: { findMany: jest.fn().mockResolvedValue([]) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    ...overrides,
  }
}

describe('AthletesService', () => {
  describe('findAll', () => {
    it('rejects roles without permission', async () => {
      const svc = new AthletesService(makePrisma() as any)
      await expect(svc.findAll('org', { role: Role.ATHLETE })).rejects.toThrow(ForbiddenException)
    })

    it('builds a search/status/sport filter and returns athletes', async () => {
      const prisma = makePrisma()
      prisma.athlete.findMany.mockResolvedValue([{ id: 'a1' }])
      const svc = new AthletesService(prisma as any)
      const res = await svc.findAll('org', coach, { status: 'ACTIVE', sportId: 's1', search: 'jo' })
      expect(res).toEqual([{ id: 'a1' }])
      const where = prisma.athlete.findMany.mock.calls[0][0].where
      expect(where).toMatchObject({ orgId: 'org', status: 'ACTIVE', sportId: 's1' })
      expect(where.OR).toHaveLength(3)
    })
  })

  describe('findOne', () => {
    it('throws when not found', async () => {
      const svc = new AthletesService(makePrisma() as any)
      await expect(svc.findOne('a1', 'org', admin)).rejects.toThrow(NotFoundException)
    })

    it('strips medical fields for non-medical staff', async () => {
      const prisma = makePrisma()
      prisma.athlete.findFirst.mockResolvedValue({
        id: 'a1',
        firstName: 'A',
        bloodType: 'O+',
        allergies: 'none',
        medications: 'x',
        medicalNotes: 'secret',
      })
      const svc = new AthletesService(prisma as any)
      const res = (await svc.findOne('a1', 'org', coach)) as any
      expect(res.bloodType).toBeUndefined()
      expect(res.medicalNotes).toBeUndefined()
      expect(res.firstName).toBe('A')
    })

    it('keeps medical fields for medical staff', async () => {
      const prisma = makePrisma()
      prisma.athlete.findFirst.mockResolvedValue({ id: 'a1', bloodType: 'O+' })
      const svc = new AthletesService(prisma as any)
      const res = (await svc.findOne('a1', 'org', medical)) as any
      expect(res.bloodType).toBe('O+')
    })
  })

  describe('create', () => {
    it('rejects insufficient permission', async () => {
      const svc = new AthletesService(makePrisma() as any)
      await expect(svc.create({ firstName: 'A' } as any, 'org', analyst)).rejects.toThrow(ForbiddenException)
    })

    it('rejects duplicate email', async () => {
      const prisma = makePrisma()
      prisma.athlete.findFirst.mockResolvedValue({ id: 'dup' })
      const svc = new AthletesService(prisma as any)
      await expect(
        svc.create({ firstName: 'A', email: 'x@y.z' } as any, 'org', coach),
      ).rejects.toThrow(BadRequestException)
    })

    it('creates athlete and writes an audit log', async () => {
      const prisma = makePrisma()
      const svc = new AthletesService(prisma as any)
      const res = await svc.create(
        { firstName: 'A', lastName: 'B', dateOfBirth: '2000-01-01', medications: 'x' } as any,
        'org',
        coach,
      )
      expect(res.orgId).toBe('org')
      expect(prisma.auditLog.create).toHaveBeenCalled()
      expect(prisma.auditLog.create.mock.calls[0][0].data.containsMedicalData).toBe(true)
    })
  })

  describe('update', () => {
    it('blocks medical staff from editing non-medical fields', async () => {
      const svc = new AthletesService(makePrisma() as any)
      await expect(
        svc.update('a1', { firstName: 'New' } as any, 'org', medical),
      ).rejects.toThrow(ForbiddenException)
    })

    it('throws when athlete missing', async () => {
      const svc = new AthletesService(makePrisma() as any)
      await expect(svc.update('a1', { status: 'ACTIVE' } as any, 'org', admin)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('updates and audits', async () => {
      const prisma = makePrisma()
      prisma.athlete.findFirst.mockResolvedValue({ id: 'a1', firstName: 'A', lastName: 'B' })
      const svc = new AthletesService(prisma as any)
      await svc.update('a1', { status: 'INJURED' } as any, 'org', admin)
      expect(prisma.athlete.update).toHaveBeenCalled()
      expect(prisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('only admins can remove', async () => {
      const svc = new AthletesService(makePrisma() as any)
      await expect(svc.remove('a1', 'org', coach)).rejects.toThrow(ForbiddenException)
    })

    it('soft-deletes and anonymizes email', async () => {
      const prisma = makePrisma()
      prisma.athlete.findFirst.mockResolvedValue({ id: 'a1', firstName: 'A', lastName: 'B', email: 'e@x.z' })
      const svc = new AthletesService(prisma as any)
      const res = await svc.remove('a1', 'org', admin)
      expect(res.message).toMatch(/removed/i)
      const data = prisma.athlete.update.mock.calls[0][0].data
      expect(data.deletedAt).toBeInstanceOf(Date)
      expect(data.email).toContain('deleted_')
    })
  })

  describe('getStats', () => {
    it('aggregates counts and by-sport', async () => {
      const prisma = makePrisma()
      prisma.athlete.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
      prisma.sport.findMany.mockResolvedValue([{ id: 's1', name: 'Soccer', _count: { athletes: 5 } }])
      const svc = new AthletesService(prisma as any)
      const stats = await svc.getStats('org', analyst)
      expect(stats).toMatchObject({ total: 10, active: 7, injured: 2, returning: 1 })
      expect(stats.bySport[0]).toEqual({ id: 's1', name: 'Soccer', count: 5 })
    })
  })
})
