import { Injectable, Optional } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'

export interface ParsedCsv {
  headers: string[]
  rows: Record<string, string>[]
}

export interface WellnessRowResult {
  line: number
  data: Record<string, unknown>
  errors: string[]
}

export interface WellnessPreview {
  totalRows: number
  validCount: number
  invalidCount: number
  rows: WellnessRowResult[]
}

const METRIC_FIELDS = [
  'sleepQuality',
  'fatigueLevel',
  'mood',
  'stressLevel',
  'muscleSoreness',
  'hydration',
  'nutrition',
] as const

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    @Optional() private audit?: AuditService,
  ) {}

  /**
   * RFC-4180-ish CSV parser: handles quoted fields, escaped quotes (""),
   * embedded commas/newlines, and CRLF or LF line endings. Pure + deterministic
   * so it can be exhaustively unit-tested.
   */
  static parseCsv(text: string): ParsedCsv {
    const records: string[][] = []
    let field = ''
    let record: string[] = []
    let inQuotes = false
    let i = 0

    while (i < text.length) {
      const c = text[i]
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"'
            i += 2
            continue
          }
          inQuotes = false
          i++
          continue
        }
        field += c
        i++
        continue
      }
      if (c === '"') {
        inQuotes = true
        i++
        continue
      }
      if (c === ',') {
        record.push(field)
        field = ''
        i++
        continue
      }
      if (c === '\r') {
        i++
        continue
      }
      if (c === '\n') {
        record.push(field)
        records.push(record)
        field = ''
        record = []
        i++
        continue
      }
      field += c
      i++
    }
    // Flush the final field/record if the input didn't end with a newline.
    if (field.length > 0 || record.length > 0) {
      record.push(field)
      records.push(record)
    }

    const nonEmpty = records.filter((r) => r.some((cell) => cell.trim() !== ''))
    if (nonEmpty.length === 0) return { headers: [], rows: [] }

    const headers = nonEmpty[0].map((h) => h.trim())
    const rows = nonEmpty.slice(1).map((cells) => {
      const obj: Record<string, string> = {}
      headers.forEach((h, idx) => {
        obj[h] = (cells[idx] ?? '').trim()
      })
      return obj
    })

    return { headers, rows }
  }

  /** Average of the provided 1–10 metrics, or null when none are present. */
  static wellnessScore(metrics: Record<string, number | undefined>): number | null {
    const values = METRIC_FIELDS.map((f) => metrics[f]).filter(
      (v): v is number => v !== undefined && v !== null,
    )
    if (values.length === 0) return null
    return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
  }

  /** Validate a single raw CSV row into a typed wellness record + error list. */
  static validateWellnessRow(raw: Record<string, string>, line: number): WellnessRowResult {
    const errors: string[] = []
    const data: Record<string, unknown> = {}

    const athleteId = raw.athleteId?.trim()
    if (!athleteId) errors.push('athleteId is required')
    data.athleteId = athleteId

    const surveyDate = raw.surveyDate?.trim()
    if (!surveyDate) {
      errors.push('surveyDate is required')
    } else if (Number.isNaN(Date.parse(surveyDate))) {
      errors.push(`surveyDate "${surveyDate}" is not a valid date`)
    } else {
      data.surveyDate = surveyDate
    }

    for (const field of METRIC_FIELDS) {
      const rawVal = raw[field]?.trim()
      if (rawVal === undefined || rawVal === '') continue
      const num = Number(rawVal)
      if (!Number.isInteger(num) || num < 1 || num > 10) {
        errors.push(`${field} "${rawVal}" must be an integer 1–10`)
      } else {
        data[field] = num
      }
    }

    if (raw.notes) data.notes = raw.notes

    return { line, data, errors }
  }

  previewWellness(csvText: string): WellnessPreview {
    const { rows } = ImportService.parseCsv(csvText)
    const results = rows.map((r, idx) => ImportService.validateWellnessRow(r, idx + 2)) // +2: header is line 1
    const invalidCount = results.filter((r) => r.errors.length > 0).length
    return {
      totalRows: results.length,
      validCount: results.length - invalidCount,
      invalidCount,
      rows: results,
    }
  }

  async importWellness(orgId: string, csvText: string, submittedById?: string) {
    const preview = this.previewWellness(csvText)
    const valid = preview.rows.filter((r) => r.errors.length === 0)

    let created = 0
    let skipped = 0
    const failures: { line: number; reason: string }[] = []

    for (const row of valid) {
      const d = row.data as any
      const metrics = Object.fromEntries(METRIC_FIELDS.map((f) => [f, d[f]]))
      try {
        await this.prisma.wellnessSurvey.upsert({
          where: {
            athleteId_surveyDate: {
              athleteId: d.athleteId,
              surveyDate: new Date(d.surveyDate),
            },
          },
          create: {
            orgId,
            athleteId: d.athleteId,
            surveyDate: new Date(d.surveyDate),
            ...metrics,
            wellnessScore: ImportService.wellnessScore(metrics),
            notes: d.notes,
            source: 'IMPORT',
            submittedById: submittedById ?? null,
          },
          update: {
            ...metrics,
            wellnessScore: ImportService.wellnessScore(metrics),
            notes: d.notes,
            source: 'IMPORT',
            updatedAt: new Date(),
          },
        })
        created++
      } catch (err) {
        skipped++
        failures.push({
          line: row.line,
          reason: err instanceof Error ? err.message : 'insert failed',
        })
      }
    }

    await this.audit?.log({
      orgId,
      userId: submittedById,
      action: 'IMPORT',
      entityType: 'wellness_survey',
      description: `Imported ${created} wellness rows (${preview.invalidCount} invalid, ${skipped} failed)`,
    })

    return {
      imported: created,
      skippedInvalid: preview.invalidCount,
      failed: skipped,
      failures,
    }
  }
}
