import { ReportsService } from '../reports.service'
import { ReportFormat, ReportStatus } from '@prisma/client'

function baseSummary() {
  return {
    generatedAt: '2026-08-05T00:00:00.000Z',
    roster: { total: 10 },
    injuryRisk: { atRiskCount: 1, atRiskPercentage: 10, riskDistribution: { HIGH: 1 } },
    injuries: { currentlyOut: 1, totalDaysLost: 5 },
    wellness: { latestTeamScore: 80, dataPoints: 3 },
    atRiskAthletes: [],
  }
}

describe('ReportsService.generateTeamSummaryReport', () => {
  function setup() {
    const updates: any[] = []
    const prisma: any = {
      generatedReport: {
        create: jest.fn().mockResolvedValue({ id: 'r1' }),
        update: jest.fn().mockImplementation(({ data }: any) => {
          updates.push(data)
          return Promise.resolve({ id: 'r1', ...data })
        }),
      },
      organization: { findUnique: jest.fn().mockResolvedValue({ name: 'Org' }) },
    }
    const calc = { getTeamAcwrSummary: jest.fn(), getAlgorithmConfig: jest.fn() }
    const injuries = {}
    const wellness = {}
    const pdf = {
      buildTeamSummaryHtml: jest.fn().mockReturnValue('<html></html>'),
      renderPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 fake')),
    }
    const svc = new ReportsService(
      prisma,
      calc as any,
      injuries as any,
      wellness as any,
      undefined,
      pdf as any,
    )
    jest.spyOn(svc, 'getTeamSummary').mockResolvedValue(baseSummary() as any)
    // avoid touching the filesystem
    jest.spyOn(svc as any, 'persistFile').mockResolvedValue('/tmp/r1.pdf')
    return { svc, prisma, pdf, updates }
  }

  it('renders a PDF and marks the report COMPLETED', async () => {
    const { svc, pdf, updates } = setup()
    const result = await svc.generateTeamSummaryReport('org', 'user', ReportFormat.PDF)
    expect(pdf.renderPdf).toHaveBeenCalled()
    expect(result.status).toBe(ReportStatus.COMPLETED)
    expect(updates.at(-1).filePath).toBe('/tmp/r1.pdf')
  })

  it('marks the report FAILED when rendering throws', async () => {
    const { svc, pdf } = setup()
    pdf.renderPdf.mockRejectedValue(new Error('chromium missing'))
    const result = await svc.generateTeamSummaryReport('org', 'user', ReportFormat.PDF)
    expect(result.status).toBe(ReportStatus.FAILED)
    expect(result.error).toContain('chromium')
  })
})

describe('ReportsService.runDueSchedules', () => {
  it('runs due schedules and advances their next-run time', async () => {
    const prisma: any = {
      scheduledReport: {
        findMany: jest.fn().mockResolvedValue([
          { id: 's1', orgId: 'org', frequency: 'DAILY', type: 'TEAM_SUMMARY', format: 'PDF', createdBy: 'u1' },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
    }
    const svc = new ReportsService(prisma, {} as any, {} as any, {} as any)
    jest
      .spyOn(svc, 'generateTeamSummaryReport')
      .mockResolvedValue({ id: 'r1', status: 'COMPLETED' } as any)

    const res = await svc.runDueSchedules(new Date('2026-08-05T08:00:00'))
    expect(res).toEqual({ ran: 1, due: 1 })
    expect(svc.generateTeamSummaryReport).toHaveBeenCalledWith('org', 'u1', 'PDF')
    expect(prisma.scheduledReport.update).toHaveBeenCalled()
  })
})
