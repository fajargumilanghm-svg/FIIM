import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock is hoisted above imports, so the mock client must be created inside a
// hoisted block to exist by the time api.service is imported and instantiated.
const { client } = vi.hoisted(() => ({
  client: {
    get: vi.fn(() => Promise.resolve({ data: { ok: true } })),
    post: vi.fn(() => Promise.resolve({ data: { ok: true } })),
    patch: vi.fn(() => Promise.resolve({ data: { ok: true } })),
    delete: vi.fn(() => Promise.resolve({ data: { ok: true } })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => client),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

import apiService from './api.service'

// The request interceptor is registered once at import; capture it before any
// beforeEach clears the mock's call history.
const requestHandler = client.interceptors.request.use.mock.calls[0][0] as any

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('ApiService endpoint methods', () => {
  it('login posts credentials', async () => {
    await apiService.login('a@b.c', 'pw', '123')
    expect(client.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.c', password: 'pw', mfaCode: '123' })
  })

  it('getAthletes forwards orgId + filters as params', async () => {
    await apiService.getAthletes('org', { search: 'jo' })
    expect(client.get).toHaveBeenCalledWith('/athletes', { params: { orgId: 'org', search: 'jo' } })
  })

  it('createInjury posts body with orgId param', async () => {
    await apiService.createInjury('org', { bodyPart: 'Knee' })
    expect(client.post).toHaveBeenCalledWith('/injuries', { bodyPart: 'Knee' }, { params: { orgId: 'org' } })
  })

  it('acknowledgeAlert patches with orgId', async () => {
    await apiService.acknowledgeAlert('al1', 'org')
    expect(client.patch).toHaveBeenCalledWith('/alerts/al1/acknowledge', {}, { params: { orgId: 'org' } })
  })

  it('deleteAthlete calls delete with orgId', async () => {
    await apiService.deleteAthlete('a1', 'org')
    expect(client.delete).toHaveBeenCalledWith('/athletes/a1', { params: { orgId: 'org' } })
  })

  it('downloadAthletesCsv requests a blob', async () => {
    await apiService.downloadAthletesCsv('org')
    expect(client.get).toHaveBeenCalledWith('/reports/export/athletes.csv', {
      params: { orgId: 'org' },
      responseType: 'blob',
    })
  })

  it('updateOrganization patches org settings', async () => {
    await apiService.updateOrganization('org', { name: 'FC' })
    expect(client.patch).toHaveBeenCalledWith('/admin/organization', { name: 'FC' }, { params: { orgId: 'org' } })
  })

  it('previewWellnessImport posts the CSV body', async () => {
    await apiService.previewWellnessImport('a,b\n1,2')
    expect(client.post).toHaveBeenCalledWith('/import/wellness/preview', { csv: 'a,b\n1,2' })
  })
})

describe('ApiService endpoint smoke coverage', () => {
  it('every endpoint method issues a request and returns response data', async () => {
    const calls: Promise<any>[] = [
      apiService.login('a', 'b'),
      apiService.register({ email: 'a', password: 'b', firstName: 'A', lastName: 'B' }),
      apiService.logout('rt'),
      apiService.getMe(),
      apiService.getAthlete('a1', 'org'),
      apiService.createAthlete({}, 'org'),
      apiService.updateAthlete('a1', {}, 'org'),
      apiService.getAthleteStats('org'),
      apiService.getTrainingSessions('org', { teamId: 't1' }),
      apiService.createTrainingSession('org', {}),
      apiService.addAthleteLoad('s1', 'org', {}),
      apiService.getAthleteLoadHistory('a1', 'org', 30),
      apiService.getAlerts('org', { status: 'OPEN' }),
      apiService.getAlertStats('org'),
      apiService.generateAlerts('org'),
      apiService.resolveAlert('al1', 'org', 'note'),
      apiService.getAlgorithmConfig('org'),
      apiService.updateAlgorithmConfig('org', {}),
      apiService.getInjuries('org', { status: 'OPEN' }),
      apiService.getInjuryStats('org'),
      apiService.updateInjury('i1', 'org', {}),
      apiService.deleteInjury('i1', 'org'),
      apiService.getTeamSummaryReport('org', { dateFrom: '2026-07-01' }),
      apiService.importWellness('org', 'csv'),
      apiService.getAuditLogs('org', { action: 'CREATE' }),
      apiService.getAuditStats('org'),
      apiService.getAdminOverview('org'),
      apiService.getOrganization('org'),
    ]
    const results = await Promise.all(calls)
    expect(results).toHaveLength(28)
    results.forEach((r) => expect(r).toEqual({ ok: true }))
  })
})

describe('ApiService request interceptor', () => {
  it('attaches a bearer token when present', () => {
    localStorage.setItem('fiim_access_token', 'tok')
    const config = requestHandler({ headers: {} })
    expect(config.headers.Authorization).toBe('Bearer tok')
  })

  it('leaves the config untouched when no token is stored', () => {
    const config = requestHandler({ headers: {} })
    expect(config.headers.Authorization).toBeUndefined()
  })
})
