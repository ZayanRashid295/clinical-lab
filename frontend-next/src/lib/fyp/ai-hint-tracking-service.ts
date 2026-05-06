"use client"

export interface AIHintUsage {
  caseId: string
  sessionId: string
  totalHintsUsed: number
  hintsByCategory: {
    [category: string]: number
  }
  hintsByImportance: {
    high: number
    medium: number
    low: number
  }
  hintTimestamps: string[]
  gradePenalty: number
  sessionStartTime: string
  sessionEndTime?: string
}

export interface HintGradeImpact {
  baseGrade: number
  hintPenalty: number
  finalGrade: number
  gradeLetter: string
  penaltyBreakdown: {
    totalHints: number
    highImportancePenalty: number
    mediumImportancePenalty: number
    lowImportancePenalty: number
    excessiveUsagePenalty: number
  }
  recommendations: string[]
}

class AIHintTrackingService {
  private static instance: AIHintTrackingService
  private hintUsages: Map<string, AIHintUsage> = new Map()

  static getInstance(): AIHintTrackingService {
    if (!AIHintTrackingService.instance) {
      AIHintTrackingService.instance = new AIHintTrackingService()
    }
    return AIHintTrackingService.instance
  }

  // Start a new hint tracking session
  startSession(caseId: string, sessionId: string): AIHintUsage {
    const session: AIHintUsage = {
      caseId,
      sessionId,
      totalHintsUsed: 0,
      hintsByCategory: {},
      hintsByImportance: {
        high: 0,
        medium: 0,
        low: 0
      },
      hintTimestamps: [],
      gradePenalty: 0,
      sessionStartTime: new Date().toISOString(),
    }

    this.hintUsages.set(sessionId, session)
    this.saveToLocalStorage()
    return session
  }

  // Track when a hint is used
  trackHintUsage(sessionId: string, category: string, importance: "high" | "medium" | "low"): AIHintUsage | null {
    const session = this.hintUsages.get(sessionId)
    if (!session) {
      console.warn(`No session found for ID: ${sessionId}`)
      return null
    }

    // Update counters
    session.totalHintsUsed += 1
    session.hintsByCategory[category] = (session.hintsByCategory[category] || 0) + 1
    session.hintsByImportance[importance] += 1
    session.hintTimestamps.push(new Date().toISOString())

    // Calculate grade penalty
    session.gradePenalty = this.calculateGradePenalty(session)

    this.hintUsages.set(sessionId, session)
    this.saveToLocalStorage()
    
    console.log(`Hint tracked: ${category} (${importance}) - Total hints: ${session.totalHintsUsed}`)
    return session
  }

  // End the session
  endSession(sessionId: string): AIHintUsage | null {
    const session = this.hintUsages.get(sessionId)
    if (!session) {
      return null
    }

    session.sessionEndTime = new Date().toISOString()
    this.hintUsages.set(sessionId, session)
    this.saveToLocalStorage()
    return session
  }

  // Get current session data
  getSession(sessionId: string): AIHintUsage | null {
    return this.hintUsages.get(sessionId) || null
  }

  // Calculate grade penalty based on hint usage
  private calculateGradePenalty(session: AIHintUsage): number {
    let penalty = 0

    // Base penalty per hint
    const basePenaltyPerHint = 2 // 2 points per hint

    // Importance-based penalties
    const highImportancePenalty = session.hintsByImportance.high * 3 // 3 points for high importance hints
    const mediumImportancePenalty = session.hintsByImportance.medium * 2 // 2 points for medium importance hints
    const lowImportancePenalty = session.hintsByImportance.low * 1 // 1 point for low importance hints

    // Excessive usage penalty (if more than 10 hints total)
    const excessiveUsagePenalty = session.totalHintsUsed > 10 ? (session.totalHintsUsed - 10) * 2 : 0

    // Rapid usage penalty (if multiple hints used within 2 minutes)
    const rapidUsagePenalty = this.calculateRapidUsagePenalty(session.hintTimestamps)

    penalty = highImportancePenalty + mediumImportancePenalty + lowImportancePenalty + excessiveUsagePenalty + rapidUsagePenalty

    return Math.min(penalty, 50) // Cap penalty at 50 points
  }

  // Calculate penalty for rapid hint usage
  private calculateRapidUsagePenalty(timestamps: string[]): number {
    if (timestamps.length < 2) return 0

    let rapidUsageCount = 0
    const twoMinutes = 2 * 60 * 1000 // 2 minutes in milliseconds

    for (let i = 1; i < timestamps.length; i++) {
      const prevTime = new Date(timestamps[i - 1]).getTime()
      const currentTime = new Date(timestamps[i]).getTime()
      
      if (currentTime - prevTime < twoMinutes) {
        rapidUsageCount++
      }
    }

    return rapidUsageCount * 1.5 // 1.5 points per rapid usage
  }

  // Calculate final grade with hint penalties
  calculateFinalGrade(baseGrade: number, sessionId: string): HintGradeImpact {
    const session = this.getSession(sessionId)
    if (!session) {
      return {
        baseGrade,
        hintPenalty: 0,
        finalGrade: baseGrade,
        gradeLetter: this.getGradeLetter(baseGrade),
        penaltyBreakdown: {
          totalHints: 0,
          highImportancePenalty: 0,
          mediumImportancePenalty: 0,
          lowImportancePenalty: 0,
          excessiveUsagePenalty: 0
        },
        recommendations: []
      }
    }

    const hintPenalty = session.gradePenalty
    const finalGrade = Math.max(0, baseGrade - hintPenalty)
    const gradeLetter = this.getGradeLetter(finalGrade)

    const penaltyBreakdown = {
      totalHints: session.totalHintsUsed,
      highImportancePenalty: session.hintsByImportance.high * 3,
      mediumImportancePenalty: session.hintsByImportance.medium * 2,
      lowImportancePenalty: session.hintsByImportance.low * 1,
      excessiveUsagePenalty: session.totalHintsUsed > 10 ? (session.totalHintsUsed - 10) * 2 : 0
    }

    const recommendations = this.generateRecommendations(session)

    return {
      baseGrade,
      hintPenalty,
      finalGrade,
      gradeLetter,
      penaltyBreakdown,
      recommendations
    }
  }

  // Convert numeric grade to letter grade
  private getGradeLetter(grade: number): string {
    if (grade >= 90) return "A"
    if (grade >= 80) return "B"
    if (grade >= 70) return "C"
    if (grade >= 60) return "D"
    return "F"
  }

  // Generate recommendations based on hint usage
  private generateRecommendations(session: AIHintUsage): string[] {
    const recommendations: string[] = []

    if (session.totalHintsUsed === 0) {
      recommendations.push("Excellent! You completed the case without using any AI hints.")
      recommendations.push("This demonstrates strong independent clinical reasoning skills.")
    } else if (session.totalHintsUsed <= 3) {
      recommendations.push("Good job! Minimal hint usage shows strong clinical reasoning.")
      recommendations.push("Consider practicing more cases to build confidence.")
    } else if (session.totalHintsUsed <= 7) {
      recommendations.push("Moderate hint usage. Focus on developing systematic questioning approaches.")
      recommendations.push("Practice with simpler cases to build foundational skills.")
    } else {
      recommendations.push("High hint usage indicates need for more clinical reasoning practice.")
      recommendations.push("Consider reviewing basic medical concepts before attempting complex cases.")
      recommendations.push("Try breaking down complex cases into smaller, manageable parts.")
    }

    if (session.hintsByImportance.high > 5) {
      recommendations.push("High usage of critical hints suggests reviewing fundamental concepts.")
    }

    if (session.hintsByImportance.medium > 8) {
      recommendations.push("Consider developing a more systematic approach to patient interviews.")
    }

    return recommendations
  }

  // Save to localStorage for persistence
  private saveToLocalStorage(): void {
    if (typeof window === "undefined") {
      return
    }
    try {
      const data = Array.from(this.hintUsages.entries())
      localStorage.setItem('aiHintUsages', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save hint usages to localStorage:', error)
    }
  }

  // Load from localStorage on initialization
  loadFromLocalStorage(): void {
    if (typeof window === "undefined") {
      return
    }
    try {
      const data = localStorage.getItem('aiHintUsages')
      if (data) {
        const entries = JSON.parse(data)
        this.hintUsages = new Map(entries)
      }
    } catch (error) {
      console.error('Failed to load hint usages from localStorage:', error)
    }
  }

  // Get all sessions for analytics
  getAllSessions(): AIHintUsage[] {
    return Array.from(this.hintUsages.values())
  }

  // Clear all data (for testing or reset)
  clearAllData(): void {
    this.hintUsages.clear()
    if (typeof window !== "undefined") {
      localStorage.removeItem('aiHintUsages')
    }
  }
}

// Initialize the service and load data
const aiHintTrackingService = AIHintTrackingService.getInstance()
if (typeof window !== "undefined") {
  aiHintTrackingService.loadFromLocalStorage()
}

export { aiHintTrackingService }

