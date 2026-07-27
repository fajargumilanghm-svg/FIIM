import { csvCell } from '../reports.service'

describe('csvCell', () => {
  it('passes through plain values', () => {
    expect(csvCell('Striker')).toBe('Striker')
    expect(csvCell(1.42)).toBe('1.42')
  })

  it('renders null/undefined as an empty cell', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })

  it('quotes values containing commas, quotes, or newlines', () => {
    expect(csvCell('Doe, John')).toBe('"Doe, John"')
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"')
  })

  it('escapes embedded double quotes by doubling them', () => {
    expect(csvCell('the "GOAT"')).toBe('"the ""GOAT"""')
  })
})
