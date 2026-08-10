import { ScheduleFrequency } from '@prisma/client'
import {
  ReportPdfService,
  escapeHtml,
  frequencyToCron,
  nextRunFor,
} from '../report-pdf.service'

describe('escapeHtml', () => {
  it('escapes HTML-significant characters', () => {
    expect(escapeHtml('<b>"x"&\'</b>')).toBe('&lt;b&gt;&quot;x&quot;&amp;&#39;&lt;/b&gt;')
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(42)).toBe('42')
  })
})

describe('frequencyToCron', () => {
  it('maps frequencies to cron expressions', () => {
    expect(frequencyToCron(ScheduleFrequency.DAILY)).toBe('0 7 * * *')
    expect(frequencyToCron(ScheduleFrequency.WEEKLY)).toBe('0 7 * * 1')
    expect(frequencyToCron(ScheduleFrequency.MONTHLY)).toBe('0 7 1 * *')
  })
})

describe('nextRunFor', () => {
  it('daily rolls to the next day when past 07:00', () => {
    const from = new Date('2026-08-05T09:00:00')
    const next = nextRunFor(ScheduleFrequency.DAILY, from)
    expect(next.getDate()).toBe(6)
    expect(next.getHours()).toBe(7)
  })

  it('weekly lands on a Monday in the future', () => {
    const from = new Date('2026-08-05T09:00:00') // Wednesday
    const next = nextRunFor(ScheduleFrequency.WEEKLY, from)
    expect(next.getDay()).toBe(1)
    expect(next.getTime()).toBeGreaterThan(from.getTime())
  })

  it('monthly lands on the 1st of next month', () => {
    const from = new Date('2026-08-05T09:00:00')
    const next = nextRunFor(ScheduleFrequency.MONTHLY, from)
    expect(next.getMonth()).toBe(8) // September (0-indexed)
    expect(next.getDate()).toBe(1)
  })
})

describe('ReportPdfService.buildTeamSummaryHtml', () => {
  const svc = new ReportPdfService()
  const data = {
    organizationName: 'FC <Test>',
    generatedAt: '2026-08-05T00:00:00.000Z',
    roster: { total: 24 },
    injuryRisk: { atRiskCount: 3, atRiskPercentage: 12.5, riskDistribution: { HIGH: 2, VERY_HIGH: 1 } },
    injuries: { currentlyOut: 2, totalDaysLost: 40 },
    wellness: { latestTeamScore: 78 },
    atRiskAthletes: [{ name: 'A B', position: 'MID', acwr: 1.6, riskLevel: 'VERY_HIGH' }],
  }

  it('produces a full HTML document with the key figures', () => {
    const html = svc.buildTeamSummaryHtml(data)
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('24') // roster
    expect(html).toContain('12.5%')
    expect(html).toContain('VERY_HIGH')
    expect(html).toContain('A B')
    // org name is escaped
    expect(html).toContain('FC &lt;Test&gt;')
  })

  it('renders an empty-state row when no at-risk athletes', () => {
    const html = svc.buildTeamSummaryHtml({ ...data, atRiskAthletes: [] })
    expect(html).toContain('No athletes currently in the high-risk band')
  })
})
