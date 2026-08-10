export interface LoadCalculationInput {
  date: Date
  load: number // Daily load (sum of all session sRPE for that day)
}

export interface AcwrResult {
  acuteLoad: number
  chronicLoad: number
  acwr: number
  ewmaAcwr?: number
  riskLevel: string
  riskColor: string
  dataPoints: number
}

export interface MonotonyStrainResult {
  weeklyLoad: number // Sum of daily loads over the acute window
  meanDailyLoad: number // Mean daily load over the window (rest days counted as 0)
  loadStdDev: number // Population standard deviation of daily load over the window
  monotony: number // meanDailyLoad / loadStdDev (Foster, 1998)
  strain: number // weeklyLoad × monotony
  monotonyRisk: string // NORMAL, ELEVATED, HIGH
  monotonyRiskColor: string
  daysCounted: number // Number of calendar days in window (rest days included)
}

export interface CalculationConfig {
  acuteWindowDays: number
  chronicWindowDays: number
  veryLowThreshold: number
  lowThreshold: number
  moderateThreshold: number
  highThreshold: number
  enableAcwr?: boolean
  enableEWMA: boolean
  ewmaConstant?: number
  enableMonotony?: boolean
  monotonyElevatedThreshold?: number
  monotonyHighThreshold?: number
  strainThreshold?: number
}

export const DEFAULT_CONFIG: CalculationConfig = {
  acuteWindowDays: 7,
  chronicWindowDays: 21,
  veryLowThreshold: 0.8,
  lowThreshold: 1.0,
  moderateThreshold: 1.3,
  highThreshold: 1.5,
  enableAcwr: true,
  enableEWMA: false,
  ewmaConstant: 0.5,
  enableMonotony: true,
  monotonyElevatedThreshold: 1.5,
  monotonyHighThreshold: 2.0,
  strainThreshold: 6000,
}

export class CalculationEngine {
  private config: CalculationConfig

  constructor(config: Partial<CalculationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Calculate ACWR for a given date based on historical daily loads.
   * 
   * Algorithm (Hulin et al., 2016; Gabbett, 2016):
   * - Acute load = sum of daily loads over the last acuteWindowDays (default 7)
   * - Chronic load = average daily load over the last chronicWindowDays (default 21)
   * - ACWR = Acute Load / Chronic Load
   * 
   * @param dailyLoads Array of {date, load} sorted ascending by date
   * @param targetDate The date for which to calculate ACWR
   * @returns AcwrResult with risk classification
   */
  calculateAcwr(dailyLoads: LoadCalculationInput[], targetDate: Date): AcwrResult | null {
    // Sort by date ascending
    const sorted = [...dailyLoads].sort((a, b) => a.date.getTime() - b.date.getTime())
    
    if (sorted.length === 0) {
      return null
    }

    // Calculate chronic load (rolling average over chronicWindowDays)
    const chronicLoad = this.calculateChronicLoad(sorted, targetDate)
    
    if (chronicLoad === null || chronicLoad === 0) {
      // Not enough data for chronic window
      return this.classifyRisk(0, 0, 0)
    }

    // Calculate acute load (rolling sum over acuteWindowDays)
    const acuteLoad = this.calculateAcuteLoad(sorted, targetDate)
    
    if (acuteLoad === null) {
      return this.classifyRisk(0, chronicLoad, 0)
    }

    const acwr = acuteLoad / chronicLoad

    // Calculate EWMA ACWR if enabled
    let ewmaAcwr: number | undefined
    if (this.config.enableEWMA) {
      const ewmaAcute = this.calculateEWMA(sorted, targetDate, true)
      const ewmaChronic = this.calculateEWMA(sorted, targetDate, false)
      if (ewmaAcute !== null && ewmaChronic !== null && ewmaChronic > 0) {
        ewmaAcwr = ewmaAcute / ewmaChronic
      }
    }

    // Count data points used
    const dataPoints = this.countDataPointsInWindow(sorted, targetDate, this.config.chronicWindowDays)

    return this.classifyRisk(acuteLoad, chronicLoad, acwr, ewmaAcwr, dataPoints)
  }

  /**
   * Calculate acute load: sum of daily loads over the last acuteWindowDays before targetDate
   */
  private calculateAcuteLoad(dailyLoads: LoadCalculationInput[], targetDate: Date): number | null {
    const windowStart = new Date(targetDate)
    windowStart.setDate(windowStart.getDate() - this.config.acuteWindowDays)
    
    const loadsInWindow = dailyLoads.filter(
      (d) => d.date > windowStart && d.date <= targetDate
    )

    if (loadsInWindow.length === 0) {
      return null
    }

    return loadsInWindow.reduce((sum, d) => sum + d.load, 0)
  }

  /**
   * Calculate chronic load: average of daily loads over the last chronicWindowDays before targetDate
   */
  private calculateChronicLoad(dailyLoads: LoadCalculationInput[], targetDate: Date): number | null {
    const windowStart = new Date(targetDate)
    windowStart.setDate(windowStart.getDate() - this.config.chronicWindowDays)
    
    const loadsInWindow = dailyLoads.filter(
      (d) => d.date > windowStart && d.date <= targetDate
    )

    if (loadsInWindow.length === 0) {
      return null
    }

    const sum = loadsInWindow.reduce((acc, d) => acc + d.load, 0)
    return parseFloat((sum / loadsInWindow.length).toFixed(2))
  }

  /**
   * Calculate EWMA (Exponentially Weighted Moving Average)
   * Used for more responsive acute/chronic load detection
   * 
   * Formula: EWMA_t = lambda * load_t + (1 - lambda) * EWMA_{t-1}
   * where lambda = 2 / (N + 1), N = window size
   */
  private calculateEWMA(
    dailyLoads: LoadCalculationInput[],
    targetDate: Date,
    isAcute: boolean,
  ): number | null {
    const windowDays = isAcute ? this.config.acuteWindowDays : this.config.chronicWindowDays
    const windowStart = new Date(targetDate)
    windowStart.setDate(windowStart.getDate() - windowDays)
    
    const loadsInWindow = dailyLoads.filter(
      (d) => d.date > windowStart && d.date <= targetDate
    )

    /* istanbul ignore next: defensive guard — calculateAcwr only invokes EWMA
       after the identical acute/chronic windows are confirmed non-empty */
    if (loadsInWindow.length === 0) {
      return null
    }

    // Lambda based on ewmaConstant or default
    const lambda = this.config.ewmaConstant || 0.5
    
    let ewma = loadsInWindow[0].load
    for (let i = 1; i < loadsInWindow.length; i++) {
      ewma = lambda * loadsInWindow[i].load + (1 - lambda) * ewma
    }

    return parseFloat(ewma.toFixed(2))
  }

  /**
   * Count valid data points within a window
   */
  private countDataPointsInWindow(
    dailyLoads: LoadCalculationInput[],
    targetDate: Date,
    windowDays: number,
  ): number {
    const windowStart = new Date(targetDate)
    windowStart.setDate(windowStart.getDate() - windowDays)
    
    return dailyLoads.filter(
      (d) => d.date > windowStart && d.date <= targetDate
    ).length
  }

  /**
   * Classify risk level based on ACWR value
   * 
   * Risk Zones (per Gabbett 2016, Hulin 2016):
   * - VERY_HIGH (≥ 1.5): Extreme risk — athletes 2.5x more likely to get injured
   * - HIGH (1.3 – 1.49): Danger zone — significantly elevated risk
   * - MODERATE (1.0 – 1.29): Sweet spot — optimal training zone
   * - LOW (0.8 – 0.99): Optimal low — acceptable underloading
   * - VERY_LOW (< 0.8): Undertraining — may reduce fitness
   */
  classifyRisk(
    acuteLoad: number,
    chronicLoad: number,
    acwr: number,
    ewmaAcwr?: number,
    dataPoints: number = 0,
  ): AcwrResult {
    let riskLevel: string
    let riskColor: string

    if (acwr >= this.config.highThreshold) {
      riskLevel = 'VERY_HIGH'
      riskColor = '#7f1d1d'
    } else if (acwr >= this.config.moderateThreshold) {
      riskLevel = 'HIGH'
      riskColor = '#dc2626'
    } else if (acwr >= this.config.lowThreshold) {
      riskLevel = 'MODERATE'
      riskColor = '#d97706'
    } else if (acwr >= this.config.veryLowThreshold) {
      riskLevel = 'LOW'
      riskColor = '#059669'
    } else if (acwr > 0) {
      riskLevel = 'VERY_LOW'
      riskColor = '#0284c7'
    } else {
      riskLevel = 'INSUFFICIENT_DATA'
      riskColor = '#6b7280'
    }

    return {
      acuteLoad: parseFloat(acuteLoad.toFixed(2)),
      chronicLoad: parseFloat(chronicLoad.toFixed(2)),
      acwr: parseFloat(acwr.toFixed(2)),
      ...(ewmaAcwr !== undefined && { ewmaAcwr: parseFloat(ewmaAcwr.toFixed(2)) }),
      riskLevel,
      riskColor,
      dataPoints,
    }
  }

  /**
   * Calculate Training Monotony and Strain (Foster, 1998).
   *
   * Over the acute window (default 7 days) — treating days with no training as
   * zero-load — compute:
   *   - weeklyLoad    = Σ daily load
   *   - meanDailyLoad = weeklyLoad / N days
   *   - loadStdDev    = population SD of daily load
   *   - monotony      = meanDailyLoad / loadStdDev
   *   - strain        = weeklyLoad × monotony
   *
   * High monotony (>2.0) combined with high load produces high strain, which is
   * associated with illness and non-functional overreaching.
   *
   * @param dailyLoads Array of {date, load} (only training days need be present)
   * @param targetDate End of the window (inclusive)
   * @returns MonotonyStrainResult, or null when there is no load in the window
   */
  calculateMonotonyStrain(
    dailyLoads: LoadCalculationInput[],
    targetDate: Date,
  ): MonotonyStrainResult | null {
    const windowDays = this.config.acuteWindowDays
    const windowStart = new Date(targetDate)
    windowStart.setDate(windowStart.getDate() - windowDays)

    // Build one bucket per calendar day in the window; rest days stay at 0.
    const buckets = new Array(windowDays).fill(0)
    for (const d of dailyLoads) {
      if (d.date > windowStart && d.date <= targetDate) {
        const dayOffset = Math.floor(
          (targetDate.getTime() - d.date.getTime()) / (1000 * 60 * 60 * 24),
        )
        const idx = windowDays - 1 - dayOffset
        if (idx >= 0 && idx < windowDays) {
          buckets[idx] += d.load
        }
      }
    }

    const weeklyLoad = buckets.reduce((sum, v) => sum + v, 0)
    if (weeklyLoad <= 0) {
      return null
    }

    const meanDailyLoad = weeklyLoad / windowDays
    const variance =
      buckets.reduce((sum, v) => sum + Math.pow(v - meanDailyLoad, 2), 0) / windowDays
    const loadStdDev = Math.sqrt(variance)

    // If every day carries an identical load, SD is 0 → monotony is undefined
    // mathematically. Guard with a small epsilon so it reads as "very high".
    const monotony = meanDailyLoad / Math.max(loadStdDev, 0.01)
    const strain = weeklyLoad * monotony

    return {
      weeklyLoad: parseFloat(weeklyLoad.toFixed(2)),
      meanDailyLoad: parseFloat(meanDailyLoad.toFixed(2)),
      loadStdDev: parseFloat(loadStdDev.toFixed(2)),
      monotony: parseFloat(monotony.toFixed(2)),
      strain: parseFloat(strain.toFixed(2)),
      daysCounted: windowDays,
      ...this.classifyMonotony(monotony, strain),
    }
  }

  /**
   * Classify monotony/strain into a risk band using configured thresholds.
   */
  private classifyMonotony(
    monotony: number,
    strain: number,
  ): { monotonyRisk: string; monotonyRiskColor: string } {
    const elevated = this.config.monotonyElevatedThreshold ?? 1.5
    const high = this.config.monotonyHighThreshold ?? 2.0
    const strainCap = this.config.strainThreshold ?? 6000

    if (monotony >= high || strain >= strainCap) {
      return { monotonyRisk: 'HIGH', monotonyRiskColor: '#dc2626' }
    }
    if (monotony >= elevated) {
      return { monotonyRisk: 'ELEVATED', monotonyRiskColor: '#d97706' }
    }
    return { monotonyRisk: 'NORMAL', monotonyRiskColor: '#059669' }
  }

  /**
   * Calculate sRPE (session Rating of Perceived Exertion) load
   * sRPE = RPE score × session duration (minutes)
   */
  static calculateSessionRpeLoad(rpeScore: number, durationMinutes: number): number {
    if (rpeScore <= 0 || durationMinutes <= 0) {
      return 0
    }
    return rpeScore * durationMinutes
  }

  /**
   * Aggregate daily loads from multiple sessions
   * Returns total load for each day
   */
  static aggregateDailyLoads(
    sessions: { date: Date; rpeScore: number; durationMinutes: number }[]
  ): LoadCalculationInput[] {
    const dailyMap = new Map<string, number>()

    for (const session of sessions) {
      const dateKey = session.date.toISOString().split('T')[0]
      const load = this.calculateSessionRpeLoad(session.rpeScore, session.durationMinutes)
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + load)
    }

    return Array.from(dailyMap.entries())
      .map(([dateStr, load]) => ({
        date: new Date(dateStr),
        load: parseFloat(load.toFixed(2)),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }
}
