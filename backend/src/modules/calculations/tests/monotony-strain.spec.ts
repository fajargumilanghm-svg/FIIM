import { CalculationEngine, LoadCalculationInput } from '../services/calculation.engine'

describe('CalculationEngine — Monotony & Strain', () => {
  let engine: CalculationEngine

  beforeEach(() => {
    engine = new CalculationEngine()
  })

  const week = (loads: number[]): LoadCalculationInput[] =>
    loads.map((load, i) => ({
      // Days 2026-07-03 .. 2026-07-09 (7 days ending on target)
      date: new Date(`2026-07-0${3 + i}`),
      load,
    }))

  it('returns null when there is no load in the window', () => {
    expect(engine.calculateMonotonyStrain([], new Date('2026-07-09'))).toBeNull()
    expect(
      engine.calculateMonotonyStrain(week([0, 0, 0, 0, 0, 0, 0]), new Date('2026-07-09')),
    ).toBeNull()
  })

  it('computes weekly load, mean, monotony and strain for a varied week', () => {
    // Loads: 300 400 500 350 450 550 400 → sum 2950, mean ≈ 421.43
    const result = engine.calculateMonotonyStrain(
      week([300, 400, 500, 350, 450, 550, 400]),
      new Date('2026-07-09'),
    )
    expect(result).not.toBeNull()
    expect(result!.weeklyLoad).toBe(2950)
    expect(result!.meanDailyLoad).toBeCloseTo(421.43, 1)
    // monotony = mean / SD; SD ≈ 82.4 → monotony ≈ 5.1
    expect(result!.monotony).toBeGreaterThan(1)
    // strain derives from full-precision monotony, so allow a small rounding gap
    expect(Math.abs(result!.strain - result!.weeklyLoad * result!.monotony)).toBeLessThan(20)
    expect(result!.daysCounted).toBe(7)
  })

  it('flags HIGH monotony when load is nearly constant every day', () => {
    // Identical loads → SD≈0 → monotony very high
    const result = engine.calculateMonotonyStrain(
      week([400, 400, 400, 400, 400, 400, 400]),
      new Date('2026-07-09'),
    )
    expect(result!.monotonyRisk).toBe('HIGH')
    expect(result!.monotony).toBeGreaterThanOrEqual(2.0)
  })

  it('counts rest days as zero load, lowering monotony', () => {
    // Two hard days, five rest days → high variability → low monotony
    const result = engine.calculateMonotonyStrain(
      week([600, 0, 0, 700, 0, 0, 0]),
      new Date('2026-07-09'),
    )
    expect(result!.weeklyLoad).toBe(1300)
    expect(result!.monotony).toBeLessThan(1.5)
    expect(result!.monotonyRisk).toBe('NORMAL')
  })

  it('flags HIGH when strain exceeds the configured strain threshold', () => {
    const strainEngine = new CalculationEngine({ strainThreshold: 1000, monotonyHighThreshold: 99 })
    const result = strainEngine.calculateMonotonyStrain(
      week([800, 400, 600, 500, 700, 550, 650]),
      new Date('2026-07-09'),
    )
    expect(result!.strain).toBeGreaterThanOrEqual(1000)
    expect(result!.monotonyRisk).toBe('HIGH')
  })

  it('respects custom elevated/high thresholds', () => {
    const custom = new CalculationEngine({
      monotonyElevatedThreshold: 0.5,
      monotonyHighThreshold: 0.6,
      strainThreshold: 1e9,
    })
    const result = custom.calculateMonotonyStrain(
      week([600, 0, 0, 700, 0, 0, 0]),
      new Date('2026-07-09'),
    )
    // monotony ~0.9 here → above 0.6 high threshold
    expect(result!.monotonyRisk).toBe('HIGH')
  })
})
