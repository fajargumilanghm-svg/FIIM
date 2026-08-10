/**
 * Delegation tests: every controller is a thin pass-through to its service.
 * These assert the routing methods forward the right arguments and return the
 * service result — no HTTP layer needed.
 */
import { AuthController } from '../auth/auth.controller'
import { UsersController } from '../users/users.controller'
import { AthletesController } from '../athletes/athletes.controller'
import { WellnessController } from '../wellness/wellness.controller'
import { TrainingLoadController } from '../training-load/training-load.controller'
import { CalculationsController } from '../calculations/calculations.controller'
import { DashboardController } from '../dashboard/dashboard.controller'
import { AlertsController } from '../alerts/alerts.controller'
import { InjuriesController } from '../injuries/injuries.controller'
import { ReportsController } from '../reports/reports.controller'
import { AuditController } from '../audit/audit.controller'
import { ImportController } from '../import/import.controller'
import { AdminController } from '../admin/admin.controller'

const req: any = { user: { id: 'u1', sub: 'u1', role: 'ORGANIZATION_ADMIN' } }
const SENTINEL = { ok: true }

/** Build a service mock whose every named method resolves to SENTINEL. */
function svc(methods: string[]) {
  const m: any = {}
  for (const name of methods) m[name] = jest.fn().mockResolvedValue(SENTINEL)
  return m
}

describe('Controllers (delegation)', () => {
  it('AuthController forwards to AuthService', async () => {
    const s = svc(['login', 'register', 'refreshToken', 'logout', 'setupMfa', 'verifyAndEnableMfa', 'disableMfa'])
    const c = new AuthController(s)
    expect(await c.login({ email: 'a' } as any)).toBe(SENTINEL)
    expect(await c.register({} as any)).toBe(SENTINEL)
    expect(await c.refreshToken({} as any)).toBe(SENTINEL)
    await c.logout({ refreshToken: 'r' }, req)
    expect(s.logout).toHaveBeenCalledWith('r', 'u1')
    await c.setupMfa({} as any, req)
    await c.verifyMfa({ code: '1' } as any, req)
    await c.disableMfa({ password: 'p' }, req)
    expect(await c.getMe(req)).toBe(req.user)
  })

  it('UsersController forwards to UsersService', async () => {
    const s = svc(['findAll', 'findMe', 'findOne', 'create', 'update', 'updateRole', 'remove'])
    const c = new UsersController(s)
    await c.findAll('org', req)
    await c.findMe(req)
    await c.findOne('id', 'org', req)
    await c.create({} as any, req)
    await c.update('id', {} as any, req)
    await c.updateRole('id', {} as any, req)
    await c.updateNotifications({} as any, req)
    await c.remove('id', req)
    expect(s.remove).toHaveBeenCalled()
  })

  it('AthletesController forwards to AthletesService', async () => {
    const s = svc(['findAll', 'getStats', 'findOne', 'create', 'update', 'remove'])
    const c = new AthletesController(s)
    await c.findAll('org', undefined, undefined, undefined, req)
    await c.getStats('org', req)
    await c.findOne('id', 'org', req)
    await c.create({} as any, 'org', req)
    await c.update('id', {} as any, 'org', req)
    await c.remove('id', 'org', req)
    expect(s.create).toHaveBeenCalled()
  })

  it('WellnessController forwards to WellnessService', async () => {
    const s = svc(['findAll', 'getAthleteTrend', 'getTeamAverage', 'findOne', 'create', 'update', 'remove'])
    const c = new WellnessController(s)
    await c.findAll('org', undefined, undefined, undefined)
    await c.getAthleteTrend('a1', 'org', '14')
    await c.getTeamAverage('org', undefined, undefined)
    await c.findOne('id', 'org')
    await c.create({} as any, 'org', req)
    await c.update('id', 'org', {} as any)
    await c.remove('id', 'org')
    expect(s.remove).toHaveBeenCalledWith('id', 'org')
  })

  it('TrainingLoadController forwards to TrainingLoadService', async () => {
    const s = svc([
      'findAllSessions',
      'findSessionById',
      'createSession',
      'updateSession',
      'deleteSession',
      'addAthleteLoad',
      'getAthleteLoadHistory',
    ])
    const c = new TrainingLoadController(s)
    await c.findAllSessions('org', undefined, undefined, undefined)
    await c.findSessionById('id', 'org')
    await c.createSession({} as any, 'org')
    await c.updateSession('id', 'org', {} as any)
    await c.deleteSession('id', 'org')
    await c.addAthleteLoad('id', 'org', {} as any)
    await c.getAthleteLoadHistory('a1', 'org', '30')
    expect(s.addAthleteLoad).toHaveBeenCalled()
  })

  it('CalculationsController forwards to CalculationsService', async () => {
    const s = svc([
      'getAlgorithmConfig',
      'updateAlgorithmConfig',
      'calculateAthleteAcwr',
      'calculateAllAthletes',
      'getAthleteAcwrHistory',
      'getTeamAcwrSummary',
    ])
    const c = new CalculationsController(s)
    await c.getConfig('org')
    await c.updateConfig('org', {})
    await c.calculateAthleteAcwr('a1', 'org', '2026-07-09')
    await c.calculateAllAthletes('org', undefined)
    await c.getAthleteAcwrHistory('a1', 'org', '30')
    await c.getTeamSummary('org', undefined)
    expect(s.getTeamAcwrSummary).toHaveBeenCalled()
  })

  it('DashboardController forwards to DashboardService', async () => {
    const s = svc([
      'getOverviewStats',
      'getAthleteStatusDistribution',
      'getTeamOverview',
      'getRecentActivity',
      'getAcwrSummary',
      'getWellnessTrend',
      'getInjuryRiskDistribution',
    ])
    const c = new DashboardController(s)
    await c.getOverview('org')
    await c.getAthleteStatusDistribution('org')
    await c.getTeamOverview('org')
    await c.getRecentActivity('org', '10')
    await c.getAcwrSummary('org')
    await c.getWellnessTrend('org', '7')
    await c.getInjuryRisk('org')
    expect(s.getInjuryRiskDistribution).toHaveBeenCalled()
  })

  it('AlertsController forwards to AlertsService', async () => {
    const s = svc(['findAll', 'getStats', 'generateForOrg', 'acknowledge', 'resolve'])
    const c = new AlertsController(s)
    await c.findAll('org', {})
    await c.getStats('org')
    await c.generate('org')
    await c.acknowledge('id', 'org', req)
    await c.resolve('id', 'org', { note: 'n' }, req)
    expect(s.resolve).toHaveBeenCalledWith('id', 'org', 'n', 'u1')
  })

  it('InjuriesController forwards to InjuriesService', async () => {
    const s = svc(['findAll', 'getStats', 'findOne', 'create', 'update', 'remove'])
    const med = svc([
      'getCaseDetail',
      'getRtpProgress',
      'initRtp',
      'updateCurrentStage',
      'advanceStage',
      'listDiagnoses',
      'addDiagnosis',
      'removeDiagnosis',
      'listTreatmentNotes',
      'addTreatmentNote',
      'listClearances',
      'createClearance',
    ])
    const c = new InjuriesController(s, med)
    await c.findAll('org', {})
    await c.getStats('org')
    await c.findOne('id', 'org')
    await c.create({} as any, 'org', req)
    await c.update('id', 'org', {} as any)
    await c.remove('id', 'org')
    expect(s.create).toHaveBeenCalled()
  })

  it('ReportsController forwards to ReportsService', async () => {
    const s = svc(['getTeamSummary', 'exportAthletesCsv'])
    const c = new ReportsController(s)
    await c.teamSummary('org', undefined, undefined)
    await c.exportAthletesCsv('org')
    expect(s.exportAthletesCsv).toHaveBeenCalledWith('org')
  })

  it('AuditController forwards to AuditService', async () => {
    const s = svc(['findAll', 'getStats'])
    const c = new AuditController(s)
    await c.findAll('org', {})
    await c.getStats('org')
    expect(s.getStats).toHaveBeenCalledWith('org')
  })

  it('ImportController forwards to ImportService', async () => {
    const s = svc(['previewWellness', 'importWellness'])
    const c = new ImportController(s)
    await c.previewWellness({ csv: 'a' })
    await c.importWellness({ csv: 'a' }, 'org', req)
    expect(s.importWellness).toHaveBeenCalledWith('org', 'a', 'u1')
  })

  it('AdminController forwards to AdminService', async () => {
    const s = svc(['getOverview', 'getOrganization', 'updateOrganization'])
    const c = new AdminController(s)
    await c.getOverview('org')
    await c.getOrganization('org')
    await c.updateOrganization('org', {}, req)
    expect(s.updateOrganization).toHaveBeenCalledWith('org', {}, 'u1')
  })

  // Exercise the default branches of optional query params (days/date/limit omitted).
  it('applies default query params when optional args are omitted', async () => {
    const calcS = svc(['calculateAthleteAcwr', 'calculateAllAthletes', 'getAthleteAcwrHistory', 'getTeamAcwrSummary'])
    const calcC = new CalculationsController(calcS)
    await calcC.calculateAthleteAcwr('a1', 'org', undefined)
    await calcC.calculateAllAthletes('org', undefined)
    await calcC.getAthleteAcwrHistory('a1', 'org', undefined)
    await calcC.getTeamSummary('org', undefined)
    expect(calcS.getAthleteAcwrHistory).toHaveBeenCalledWith('a1', 'org', 30)

    const dashS = svc(['getRecentActivity', 'getWellnessTrend'])
    const dashC = new DashboardController(dashS)
    await dashC.getRecentActivity('org', undefined)
    await dashC.getWellnessTrend('org', undefined)
    expect(dashS.getWellnessTrend).toHaveBeenCalledWith('org', 7)

    const tlS = svc(['getAthleteLoadHistory'])
    const tlC = new TrainingLoadController(tlS)
    await tlC.getAthleteLoadHistory('a1', 'org', undefined)
    expect(tlS.getAthleteLoadHistory).toHaveBeenCalledWith('a1', 'org', 30)

    const wS = svc(['getAthleteTrend'])
    const wC = new WellnessController(wS)
    await wC.getAthleteTrend('a1', 'org', undefined)
    expect(wS.getAthleteTrend).toHaveBeenCalledWith('a1', 'org', 14)
  })
})
