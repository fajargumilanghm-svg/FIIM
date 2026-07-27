import { CalculationEngine, DEFAULT_CONFIG, LoadCalculationInput } from '../services/calculation.engine'

describe('CalculationEngine', () => {
  let engine: CalculationEngine

  beforeEach(() => {
    engine = new CalculationEngine()
  })

  describe('calculateAcwr', () => {
    it('should return null for empty dailyLoads', () => {
      const result = engine.calculateAcwr([], new Date('2026-07-09'))
      expect(result).toBeNull()
    })

    it('should calculate correct acute load (7-day sum)', () => {
      const dailyLoads: LoadCalculationInput[] = [
        { date: new Date('2026-07-01'), load: 300 },
        { date: new Date('2026-07-02'), load: 400 },
        { date: new Date('2026-07-03'), load: 500 },
        { date: new Date('2026-07-04'), load: 350 },
        { date: new Date('2026-07-05'), load: 450 },
        { date: new Date('2026-07-06'), load: 550 },
        { date: new Date('2026-07-07'), load: 400 },
        { date: new Date('2026-07-08'), load: 600 },
        { date: new Date('2026-07-09'), load: 500 },
      ]

      const result = engine.calculateAcwr(dailyLoads, new Date('2026-07-09'))

      expect(result).not.toBeNull()
      // Acute load = sum of last 7 days: 350+450+550+400+600+500+... wait
      // The acute window is calcDate minus 7 days, so from 2026-07-02 to 2026-07-09
      // Actually the logic is > windowStart and <= targetDate
      // windowStart = 2026-07-02
      // So loads from 2026-07-03 to 2026-07-09 = 500+350+450+550+400+600+500 = 3350? No...
      // Let me trace: windowStart = 2026-07-02, so dates > 2026-07-02 are 2026-07-03 through 2026-07-09
      expect(result!.acuteLoad).toBe(500 + 350 + 450 + 550 + 400 + 600 + 500)
      expect(result!.acuteLoad).toBe(3350)
    })

    it('should calculate correct chronic load (21-day average)', () => {
      // Create 21 days of data
      const dailyLoads: LoadCalculationInput[] = []
      for (let i = 21; i >= 0; i--) {
        const date = new Date('2026-07-09')
        date.setDate(date.getDate() - i)
        dailyLoads.push({ date, load: 400 })
      }

      const result = engine.calculateAcwr(dailyLoads, new Date('2026-07-09'))

      expect(result).not.toBeNull()
      // Chronic load = average of last 21 days (from 2026-06-19 to 2026-07-09)
      // All loads are 400, so average should be 400
      expect(result!.chronicLoad).toBe(400)
    })

    it('should calculate correct ACWR ratio', () => {
      const dailyLoads: LoadCalculationInput[] = []
      // 21 days: chronic average = 400
      for (let i = 21; i >= 0; i--) {
        const date = new Date('2026-07-09')
        date.setDate(date.getDate() - i)
        dailyLoads.push({ date, load: 400 })
      }
      // But last 7 days: acute = higher loads
      dailyLoads[dailyLoads.length - 1].load = 600 // 2026-07-09
      dailyLoads[dailyLoads.length - 2].load = 600 // 2026-07-08
      dailyLoads[dailyLoads.length - 3].load = 600 // 2026-07-07
      dailyLoads[dailyLoads.length - 4].load = 600 // 2026-07-06
      dailyLoads[dailyLoads.length - 5].load = 600 // 2026-07-05
      dailyLoads[dailyLoads.length - 6].load = 600 // 2026-07-04
      dailyLoads[dailyLoads.length - 7].load = 600 // 2026-07-03

      const result = engine.calculateAcwr(dailyLoads, new Date('2026-07-09'))

      expect(result).not.toBeNull()
      // Acute = 600 * 7 = 4200
      // Chronic = average of 21 days. 14 days at 400 + 7 days at 600 = (5600 + 4200) / 21 = 466.67
      // ACWR = 4200 / 466.67 = 9.0
      expect(result!.acwr).toBeGreaterThan(8)
    })

    it('should handle insufficient data gracefully', () => {
      // Only 3 days of data, but chronic needs 21
      const dailyLoads: LoadCalculationInput[] = [
        { date: new Date('2026-07-07'), load: 400 },
        { date: new Date('2026-07-08'), load: 500 },
        { date: new Date('2026-07-09'), load: 600 },
      ]

      const result = engine.calculateAcwr(dailyLoads, new Date('2026-07-09'))

      // Chronic load won't be null because it averages whatever is available
      expect(result).not.toBeNull()
    })

    it('should return INSUFFICIENT_DATA when all loads fall outside the chronic window', () => {
      // Loads exist but all predate the 21-day chronic window before targetDate
      const dailyLoads: LoadCalculationInput[] = [
        { date: new Date('2026-01-05'), load: 400 },
        { date: new Date('2026-01-06'), load: 500 },
      ]

      const result = engine.calculateAcwr(dailyLoads, new Date('2026-07-09'))

      expect(result).not.toBeNull()
      expect(result!.riskLevel).toBe('INSUFFICIENT_DATA')
      expect(result!.chronicLoad).toBe(0)
      expect(result!.acuteLoad).toBe(0)
    })

    it('should return acwr 0 when chronic window has data but acute window is empty', () => {
      // Loads sit inside the 21-day chronic window but outside the 7-day acute window
      const dailyLoads: LoadCalculationInput[] = [
        { date: new Date('2026-06-20'), load: 400 },
        { date: new Date('2026-06-21'), load: 450 },
        { date: new Date('2026-06-22'), load: 500 },
      ]

      const result = engine.calculateAcwr(dailyLoads, new Date('2026-07-09'))

      expect(result).not.toBeNull()
      expect(result!.acuteLoad).toBe(0)
      expect(result!.chronicLoad).toBeGreaterThan(0)
      expect(result!.acwr).toBe(0)
      expect(result!.riskLevel).toBe('INSUFFICIENT_DATA')
    })
  })

  describe('classifyRisk', () => {
    it('should classify VERY_LOW for ACWR < 0.8', () => {
      const result = engine.classifyRisk(300, 500, 0.6)
      expect(result.riskLevel).toBe('VERY_LOW')
      expect(result.riskColor).toBe('#0284c7')
    })

    it('should classify LOW for 0.8 <= ACWR < 1.0', () => {
      const result = engine.classifyRisk(450, 500, 0.9)
      expect(result.riskLevel).toBe('LOW')
      expect(result.riskColor).toBe('#059669')
    })

    it('should classify MODERATE for 1.0 <= ACWR < 1.3', () => {
      const result = engine.classifyRisk(550, 500, 1.1)
      expect(result.riskLevel).toBe('MODERATE')
      expect(result.riskColor).toBe('#d97706')
    })

    it('should classify HIGH for 1.3 <= ACWR < 1.5', () => {
      const result = engine.classifyRisk(700, 500, 1.4)
      expect(result.riskLevel).toBe('HIGH')
      expect(result.riskColor).toBe('#dc2626')
    })

    it('should classify VERY_HIGH for ACWR >= 1.5', () => {
      const result = engine.classifyRisk(800, 500, 1.6)
      expect(result.riskLevel).toBe('VERY_HIGH')
      expect(result.riskColor).toBe('#7f1d1d')
    })

    it('should handle zero values', () => {
      const result = engine.classifyRisk(0, 0, 0)
      expect(result.riskLevel).toBe('INSUFFICIENT_DATA')
      expect(result.riskColor).toBe('#6b7280')
    })
  })

  describe('calculateSessionRpeLoad', () => {
    it('should calculate sRPE correctly', () => {
      expect(CalculationEngine.calculateSessionRpeLoad(7, 60)).toBe(420)
      expect(CalculationEngine.calculateSessionRpeLoad(5, 90)).toBe(450)
    })

    it('should return 0 for invalid inputs', () => {
      expect(CalculationEngine.calculateSessionRpeLoad(0, 60)).toBe(0)
      expect(CalculationEngine.calculateSessionRpeLoad(7, 0)).toBe(0)
      expect(CalculationEngine.calculateSessionRpeLoad(-1, 60)).toBe(0)
    })
  })

  describe('aggregateDailyLoads', () => {
    it('should aggregate multiple sessions per day', () => {
      const sessions = [
        { date: new Date('2026-07-09'), rpeScore: 7, durationMinutes: 60 }, // 420
        { date: new Date('2026-07-09'), rpeScore: 5, durationMinutes: 30 }, // 150
        { date: new Date('2026-07-08'), rpeScore: 6, durationMinutes: 45 }, // 270
      ]

      const result = CalculationEngine.aggregateDailyLoads(sessions)

      expect(result).toHaveLength(2)
      expect(result[0].load).toBe(270)
      expect(result[1].load).toBe(570) // 420 + 150
    })

    it('should return sorted results by date', () => {
      const sessions = [
        { date: new Date('2026-07-10'), rpeScore: 5, durationMinutes: 60 },
        { date: new Date('2026-07-08'), rpeScore: 6, durationMinutes: 45 },
        { date: new Date('2026-07-09'), rpeScore: 7, durationMinutes: 60 },
      ]

      const result = CalculationEngine.aggregateDailyLoads(sessions)

      expect(result[0].date.toISOString().split('T')[0]).toBe('2026-07-08')
      expect(result[1].date.toISOString().split('T')[0]).toBe('2026-07-09')
      expect(result[2].date.toISOString().split('T')[0]).toBe('2026-07-10')
    })
  })

  describe('EWMA calculations', () => {
    it('should calculate EWMA when enabled', () => {
      const ewmaEngine = new CalculationEngine({
        ...DEFAULT_CONFIG,
        enableEWMA: true,
        ewmaConstant: 0.5,
      })

      const dailyLoads: LoadCalculationInput[] = []
      for (let i = 21; i >= 0; i--) {
        const date = new Date('2026-07-09')
        date.setDate(date.getDate() - i)
        dailyLoads.push({ date, load: 400 })
      }

      const result = ewmaEngine.calculateAcwr(dailyLoads, new Date('2026-07-09'))

      expect(result).not.toBeNull()
      expect(result!.ewmaAcwr).toBeDefined()
    })

    it('should fall back to the default lambda when ewmaConstant is unset', () => {
      const ewmaEngine = new CalculationEngine({
        ...DEFAULT_CONFIG,
        enableEWMA: true,
        ewmaConstant: undefined,
      })

      const dailyLoads: LoadCalculationInput[] = []
      for (let i = 21; i >= 0; i--) {
        const date = new Date('2026-07-09')
        date.setDate(date.getDate() - i)
        dailyLoads.push({ date, load: 400 })
      }

      const result = ewmaEngine.calculateAcwr(dailyLoads, new Date('2026-07-09'))

      expect(result).not.toBeNull()
      expect(result!.ewmaAcwr).toBeDefined()
    })
  })

  describe('custom thresholds', () => {
    it('should use custom thresholds', () => {
      const customEngine = new CalculationEngine({
        ...DEFAULT_CONFIG,
        veryLowThreshold: 0.5,
        lowThreshold: 0.8,
        moderateThreshold: 1.0,
        highThreshold: 1.2,
      })

      // ACWR = 0.4
      // >= veryLow (0.5)? NO
      // > 0: YES
      // So VERY_LOW
      const result = customEngine.classifyRisk(200, 500, 0.4)
      expect(result.riskLevel).toBe('VERY_LOW')

      // ACWR = 0.7
      // >= veryLow (0.5) ✓
      // >= low (0.8)? NO
      // So LOW
      const result2 = customEngine.classifyRisk(350, 500, 0.7)
      expect(result2.riskLevel).toBe('LOW')

      // ACWR = 0.9
      // >= low (0.8) ✓
      // >= moderate (1.0)? NO
      // So MODERATE
      const result3 = customEngine.classifyRisk(450, 500, 0.9)
      expect(result3.riskLevel).toBe('MODERATE')

      // ACWR = 1.1
      // >= moderate (1.0) ✓
      // >= high (1.2)? NO
      // So HIGH
      const result4 = customEngine.classifyRisk(550, 500, 1.1)
      expect(result4.riskLevel).toBe('HIGH')

      // ACWR = 1.25
      // >= high (1.2) ✓
      const result5 = customEngine.classifyRisk(650, 500, 1.25)
      expect(result5.riskLevel).toBe('VERY_HIGH')
    })
  })
})
