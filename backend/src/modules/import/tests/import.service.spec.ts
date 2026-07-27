import { ImportService } from '../import.service'

describe('ImportService.parseCsv', () => {
  it('parses a simple header + rows', () => {
    const { headers, rows } = ImportService.parseCsv('a,b,c\n1,2,3\n4,5,6')
    expect(headers).toEqual(['a', 'b', 'c'])
    expect(rows).toEqual([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' },
    ])
  })

  it('handles quoted fields with embedded commas', () => {
    const { rows } = ImportService.parseCsv('name,note\n"Doe, John","hello, world"')
    expect(rows[0]).toEqual({ name: 'Doe, John', note: 'hello, world' })
  })

  it('handles escaped double quotes', () => {
    const { rows } = ImportService.parseCsv('q\n"the ""GOAT"""')
    expect(rows[0].q).toBe('the "GOAT"')
  })

  it('handles embedded newlines inside quotes', () => {
    const { rows } = ImportService.parseCsv('note\n"line1\nline2"')
    expect(rows[0].note).toBe('line1\nline2')
  })

  it('treats CRLF the same as LF and ignores blank lines', () => {
    const { rows } = ImportService.parseCsv('a\r\n1\r\n\r\n2\r\n')
    expect(rows).toEqual([{ a: '1' }, { a: '2' }])
  })

  it('returns empty for blank input', () => {
    expect(ImportService.parseCsv('   ')).toEqual({ headers: [], rows: [] })
  })

  it('pads missing trailing columns with empty strings', () => {
    const { rows } = ImportService.parseCsv('a,b,c\n1,2')
    expect(rows[0]).toEqual({ a: '1', b: '2', c: '' })
  })
})

describe('ImportService.wellnessScore', () => {
  it('averages present metrics to 2 decimals', () => {
    expect(ImportService.wellnessScore({ sleepQuality: 8, mood: 6 })).toBe(7)
    expect(ImportService.wellnessScore({ sleepQuality: 8, fatigueLevel: 5, mood: 6 })).toBe(6.33)
  })

  it('returns null when no metrics are present', () => {
    expect(ImportService.wellnessScore({})).toBeNull()
  })
})

describe('ImportService.validateWellnessRow', () => {
  it('accepts a valid row', () => {
    const r = ImportService.validateWellnessRow(
      { athleteId: 'a1', surveyDate: '2026-07-01', sleepQuality: '8', mood: '7' },
      2,
    )
    expect(r.errors).toEqual([])
    expect(r.data).toMatchObject({ athleteId: 'a1', surveyDate: '2026-07-01', sleepQuality: 8, mood: 7 })
  })

  it('flags missing athleteId and invalid date', () => {
    const r = ImportService.validateWellnessRow({ surveyDate: 'not-a-date' }, 2)
    expect(r.errors).toContain('athleteId is required')
    expect(r.errors.some((e) => e.includes('not a valid date'))).toBe(true)
  })

  it('flags out-of-range and non-integer metrics', () => {
    const r = ImportService.validateWellnessRow(
      { athleteId: 'a1', surveyDate: '2026-07-01', mood: '11', sleepQuality: '3.5' },
      2,
    )
    expect(r.errors.some((e) => e.includes('mood'))).toBe(true)
    expect(r.errors.some((e) => e.includes('sleepQuality'))).toBe(true)
  })

  it('ignores blank optional metrics', () => {
    const r = ImportService.validateWellnessRow(
      { athleteId: 'a1', surveyDate: '2026-07-01', mood: '', hydration: '  ' },
      2,
    )
    expect(r.errors).toEqual([])
    expect(r.data).not.toHaveProperty('mood')
  })
})

describe('ImportService.previewWellness', () => {
  it('summarizes valid vs invalid rows with correct line numbers', () => {
    const svc = new ImportService({} as any)
    const csv = [
      'athleteId,surveyDate,mood',
      'a1,2026-07-01,7', // line 2 valid
      ',2026-07-02,7', // line 3 invalid (no athleteId)
      'a3,bad-date,7', // line 4 invalid (bad date)
    ].join('\n')

    const preview = svc.previewWellness(csv)
    expect(preview.totalRows).toBe(3)
    expect(preview.validCount).toBe(1)
    expect(preview.invalidCount).toBe(2)
    expect(preview.rows[0].line).toBe(2)
    expect(preview.rows[1].line).toBe(3)
  })
})
