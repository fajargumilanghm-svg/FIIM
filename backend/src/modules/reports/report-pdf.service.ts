import { Injectable } from '@nestjs/common'
import { ScheduleFrequency } from '@prisma/client'

/** Escape a value for safe embedding in HTML. */
export function escapeHtml(value: unknown): string {
  const s = value == null ? '' : String(value)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Map a schedule frequency to a cron expression (server local time).
 *  - DAILY   → 07:00 every day
 *  - WEEKLY  → 07:00 every Monday
 *  - MONTHLY → 07:00 on the 1st
 */
export function frequencyToCron(freq: ScheduleFrequency): string {
  switch (freq) {
    case ScheduleFrequency.DAILY:
      return '0 7 * * *'
    case ScheduleFrequency.WEEKLY:
      return '0 7 * * 1'
    case ScheduleFrequency.MONTHLY:
      return '0 7 1 * *'
    default:
      return '0 7 * * *'
  }
}

/** Compute the next run time for a frequency from a base date. */
export function nextRunFor(freq: ScheduleFrequency, from: Date = new Date()): Date {
  const next = new Date(from)
  next.setHours(7, 0, 0, 0)
  switch (freq) {
    case ScheduleFrequency.DAILY:
      if (next <= from) next.setDate(next.getDate() + 1)
      break
    case ScheduleFrequency.WEEKLY: {
      // advance to next Monday
      do {
        next.setDate(next.getDate() + 1)
      } while (next.getDay() !== 1 || next <= from)
      break
    }
    case ScheduleFrequency.MONTHLY:
      next.setMonth(next.getMonth() + 1, 1)
      break
  }
  return next
}

interface TeamSummaryData {
  organizationName?: string
  generatedAt: string
  roster: { total: number }
  injuryRisk: { atRiskCount: number; atRiskPercentage: number; riskDistribution: Record<string, number> }
  injuries: { currentlyOut: number; totalDaysLost: number }
  wellness: { latestTeamScore: number | null }
  atRiskAthletes: { name: string; position?: string; acwr: number; riskLevel: string }[]
}

@Injectable()
export class ReportPdfService {
  /**
   * Build a self-contained, print-ready HTML document for the team summary.
   * Pure and dependency-free so it can be unit-tested without a browser.
   */
  buildTeamSummaryHtml(data: TeamSummaryData): string {
    const dist = data.injuryRisk.riskDistribution ?? {}
    const distRows = Object.entries(dist)
      .map(
        ([level, count]) =>
          `<tr><td>${escapeHtml(level)}</td><td class="num">${escapeHtml(count)}</td></tr>`,
      )
      .join('')

    const atRiskRows = data.atRiskAthletes.length
      ? data.atRiskAthletes
          .map(
            (a) =>
              `<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.position ?? '—')}</td><td class="num">${escapeHtml(a.acwr)}</td><td>${escapeHtml(a.riskLevel)}</td></tr>`,
          )
          .join('')
      : `<tr><td colspan="4" class="empty">No athletes currently in the high-risk band.</td></tr>`

    return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
  body { color: #111827; margin: 40px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .muted { color: #6b7280; font-size: 12px; }
  .cards { display: flex; gap: 16px; margin: 24px 0; }
  .card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .card .value { font-size: 26px; font-weight: 700; }
  .card .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
  th { background: #f9fafb; text-transform: uppercase; font-size: 11px; color: #6b7280; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.empty { color: #6b7280; text-align: center; }
  h2 { font-size: 15px; margin-top: 24px; }
</style></head><body>
  <h1>${escapeHtml(data.organizationName ?? 'Team')} — Load & Risk Summary</h1>
  <div class="muted">Generated ${escapeHtml(data.generatedAt)}</div>
  <div class="cards">
    <div class="card"><div class="value">${escapeHtml(data.roster.total)}</div><div class="label">Athletes</div></div>
    <div class="card"><div class="value">${escapeHtml(data.injuryRisk.atRiskCount)}</div><div class="label">At-risk (${escapeHtml(data.injuryRisk.atRiskPercentage)}%)</div></div>
    <div class="card"><div class="value">${escapeHtml(data.injuries.currentlyOut)}</div><div class="label">Currently injured</div></div>
    <div class="card"><div class="value">${escapeHtml(data.wellness.latestTeamScore ?? '—')}</div><div class="label">Team wellness</div></div>
  </div>
  <h2>ACWR risk distribution</h2>
  <table><thead><tr><th>Risk level</th><th class="num">Athletes</th></tr></thead><tbody>${distRows}</tbody></table>
  <h2>High-risk athletes</h2>
  <table><thead><tr><th>Athlete</th><th>Position</th><th class="num">ACWR</th><th>Risk</th></tr></thead><tbody>${atRiskRows}</tbody></table>
</body></html>`
  }

  /**
   * Render HTML to a PDF buffer via Puppeteer. Imported lazily so unit tests
   * that only touch HTML building never spin up Chromium.
   */
  async renderPdf(html: string): Promise<Buffer> {
    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.launch({
      headless: true,
      // Honour a system Chromium (set in the Docker image) when provided.
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } })
      return Buffer.from(pdf)
    } finally {
      await browser.close()
    }
  }
}
