import { Injectable, NotFoundException, Optional } from '@nestjs/common'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import {
  Prisma,
  ReportFormat,
  ReportStatus,
  ReportType,
  ScheduleFrequency,
} from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CalculationsService } from '../calculations/calculations.service'
import { InjuriesService } from '../injuries/injuries.service'
import { WellnessService } from '../wellness/wellness.service'
import { NotificationsService } from '../notifications/notifications.service'
import { ReportPdfService, nextRunFor } from './report-pdf.service'
import { CreateScheduleDto, UpdateScheduleDto } from './dto/reports.dto'

// Where generated report files land. Overridable via env for S3-fronted mounts.
export const REPORT_STORAGE_DIR = resolve(process.env.REPORT_STORAGE_DIR || './storage/reports')

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private calculations: CalculationsService,
    private injuries: InjuriesService,
    private wellness: WellnessService,
    @Optional() private audit?: AuditService,
    @Optional() private pdf?: ReportPdfService,
    @Optional() private notifications?: NotificationsService,
  ) {}

  /**
   * Cross-module team snapshot: ACWR risk distribution, injury burden, and
   * average wellness — the numbers a performance director wants weekly.
   */
  async getTeamSummary(orgId: string, dateFrom?: string, dateTo?: string) {
    const [acwr, injuryStats, wellnessAvg, athleteCount] = await Promise.all([
      this.calculations.getTeamAcwrSummary(orgId),
      this.injuries.getStats(orgId),
      this.wellness.getTeamAverage(orgId, dateFrom, dateTo),
      this.prisma.athlete.count({ where: { orgId, deletedAt: null } }),
    ])

    const latestWellness = wellnessAvg.length ? wellnessAvg[wellnessAvg.length - 1] : null

    return {
      generatedAt: new Date().toISOString(),
      period: { from: dateFrom ?? null, to: dateTo ?? null },
      roster: { total: athleteCount },
      injuryRisk: {
        atRiskCount: acwr.atRiskCount,
        atRiskPercentage: acwr.atRiskPercentage,
        riskDistribution: acwr.riskDistribution,
      },
      injuries: {
        currentlyOut: injuryStats.currentlyOut,
        totalDaysLost: injuryStats.totalDaysLost,
        bySeverity: injuryStats.bySeverity,
      },
      wellness: {
        latestTeamScore: latestWellness?.wellnessScore ?? null,
        dataPoints: wellnessAvg.length,
      },
      atRiskAthletes: acwr.athletes
        .filter((a: any) => a.riskLevel === 'HIGH' || a.riskLevel === 'VERY_HIGH')
        .map((a: any) => ({
          name: a.name,
          position: a.position,
          acwr: a.acwr,
          riskLevel: a.riskLevel,
        })),
    }
  }

  /**
   * CSV export of the current ACWR standing per athlete. Returns a raw CSV
   * string; the controller sets the download headers.
   */
  async exportAthletesCsv(orgId: string): Promise<string> {
    const summary = await this.calculations.getTeamAcwrSummary(orgId)
    const header = ['Athlete', 'Position', 'Acute Load', 'Chronic Load', 'ACWR', 'Risk Level']

    const rows = summary.athletes.map((a: any) =>
      [a.name, a.position ?? '', a.acuteLoad ?? '', a.chronicLoad ?? '', a.acwr ?? '', a.riskLevel ?? '']
        .map((v) => csvCell(v))
        .join(','),
    )

    await this.audit?.log({
      orgId,
      action: 'EXPORT',
      entityType: 'report',
      description: `Exported ACWR CSV for ${summary.athletes.length} athletes`,
    })

    return [header.map(csvCell).join(','), ...rows].join('\n')
  }

  // ---- PDF report generation & history -----------------------------------

  async listReports(orgId: string) {
    return this.prisma.generatedReport.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  async getReport(id: string, orgId: string) {
    const report = await this.prisma.generatedReport.findFirst({ where: { id, orgId } })
    if (!report) throw new NotFoundException('Report not found')
    return report
  }

  /**
   * Generate a team-summary PDF: create a PENDING record, render, persist the
   * file to storage, then flip the record to COMPLETED (or FAILED). Runs inline
   * but is safe to call from a queue/cron.
   */
  async generateTeamSummaryReport(
    orgId: string,
    userId?: string,
    format: ReportFormat = ReportFormat.PDF,
  ) {
    const report = await this.prisma.generatedReport.create({
      data: {
        orgId,
        type: ReportType.TEAM_SUMMARY,
        format,
        status: ReportStatus.GENERATING,
        title: `Team Load & Risk Summary — ${new Date().toISOString().split('T')[0]}`,
        requestedBy: userId ?? null,
      },
    })

    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      })
      const summary = await this.getTeamSummary(orgId)

      let filePath: string
      let fileSize: number

      if (format === ReportFormat.CSV) {
        const csv = await this.exportAthletesCsv(orgId)
        filePath = await this.persistFile(report.id, 'csv', Buffer.from(csv, 'utf8'))
        fileSize = Buffer.byteLength(csv)
      } else {
        if (!this.pdf) throw new Error('PDF renderer unavailable')
        const html = this.pdf.buildTeamSummaryHtml({
          organizationName: org?.name,
          generatedAt: summary.generatedAt,
          roster: summary.roster,
          injuryRisk: summary.injuryRisk,
          injuries: summary.injuries,
          wellness: summary.wellness,
          atRiskAthletes: summary.atRiskAthletes,
        })
        const buffer = await this.pdf.renderPdf(html)
        filePath = await this.persistFile(report.id, 'pdf', buffer)
        fileSize = buffer.length
      }

      const completed = await this.prisma.generatedReport.update({
        where: { id: report.id },
        data: { status: ReportStatus.COMPLETED, filePath, fileSize, completedAt: new Date() },
      })
      await this.audit?.log({
        orgId,
        userId,
        action: 'EXPORT',
        entityType: 'report',
        entityId: report.id,
        description: `Generated ${format} team summary report`,
      })
      return completed
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Report generation failed'
      return this.prisma.generatedReport.update({
        where: { id: report.id },
        data: { status: ReportStatus.FAILED, error: message },
      })
    }
  }

  private async persistFile(reportId: string, ext: string, data: Buffer): Promise<string> {
    await fs.mkdir(REPORT_STORAGE_DIR, { recursive: true })
    const filePath = join(REPORT_STORAGE_DIR, `${reportId}.${ext}`)
    await fs.writeFile(filePath, data)
    return filePath
  }

  /** Resolve a completed report's file for download. */
  async getReportFile(id: string, orgId: string): Promise<{ path: string; report: any }> {
    const report = await this.getReport(id, orgId)
    if (report.status !== ReportStatus.COMPLETED || !report.filePath) {
      throw new NotFoundException('Report file is not ready')
    }
    return { path: report.filePath, report }
  }

  // ---- Scheduled reports --------------------------------------------------

  async listSchedules(orgId: string) {
    return this.prisma.scheduledReport.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } })
  }

  async createSchedule(orgId: string, dto: CreateScheduleDto, userId?: string) {
    return this.prisma.scheduledReport.create({
      data: {
        orgId,
        type: dto.type ?? ReportType.TEAM_SUMMARY,
        format: dto.format ?? ReportFormat.PDF,
        frequency: dto.frequency,
        recipients: dto.recipients ?? [],
        enabled: dto.enabled ?? true,
        nextRunAt: nextRunFor(dto.frequency),
        createdBy: userId ?? null,
      },
    })
  }

  async updateSchedule(id: string, orgId: string, dto: UpdateScheduleDto) {
    const existing = await this.prisma.scheduledReport.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException('Schedule not found')
    const data: Prisma.ScheduledReportUpdateInput = { ...dto }
    if (dto.frequency) data.nextRunAt = nextRunFor(dto.frequency)
    return this.prisma.scheduledReport.update({ where: { id }, data })
  }

  async removeSchedule(id: string, orgId: string) {
    const existing = await this.prisma.scheduledReport.findFirst({ where: { id, orgId } })
    if (!existing) throw new NotFoundException('Schedule not found')
    await this.prisma.scheduledReport.delete({ where: { id } })
    return { message: 'Schedule removed' }
  }

  /**
   * Run every enabled schedule whose nextRunAt has passed. Generates the report
   * and advances the schedule. Invoked by the hourly scheduler tick.
   */
  async runDueSchedules(now: Date = new Date()) {
    const due = await this.prisma.scheduledReport.findMany({
      where: { enabled: true, nextRunAt: { lte: now } },
    })

    let ran = 0
    for (const schedule of due) {
      try {
        await this.generateTeamSummaryReport(schedule.orgId, schedule.createdBy ?? undefined, schedule.format)
        // Notify org admins the report is ready.
        await this.notifications?.dispatchToRoles(schedule.orgId, {
          type: 'SYSTEM',
          title: 'Scheduled report generated',
          body: `Your ${schedule.frequency.toLowerCase()} ${schedule.type} report is ready.`,
          relatedType: 'scheduled_report',
          relatedId: schedule.id,
        })
        ran++
      } catch {
        // best-effort; individual failures are recorded on the report row
      }
      await this.prisma.scheduledReport.update({
        where: { id: schedule.id },
        data: { lastRunAt: now, nextRunAt: nextRunFor(schedule.frequency, now) },
      })
    }
    return { ran, due: due.length }
  }
}

/** Quote and escape a value for safe CSV output. */
export function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}
