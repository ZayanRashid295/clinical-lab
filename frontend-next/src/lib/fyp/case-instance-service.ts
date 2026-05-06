import { sampleCases } from './data-models'

export interface CaseInstanceData {
  id: string
  title: string
  description: string
  difficulty: string
  specialty?: string
  estimatedTime?: number
  learningObjectives?: string
  patientProfile: {
    name: string
    age: number
    gender: string
    occupation: string
  }
  symptoms: string[]
  history: string[]
  labs: Record<string, any>
  expectedQuestions: string[]
  isCustom?: boolean
}

export class CaseInstanceService {
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      return window.location.origin
    } else {
      // Server-side: use environment variable or default
      return process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    }
  }

  /**
   * Create a new case instance for a student study session
   */
  async createCaseInstance(
    userId: string, 
    templateCaseId?: string, 
    customCaseData?: any
  ): Promise<CaseInstanceData> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/case-instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          templateCaseId,
          customCaseData
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create case instance: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create case instance')
      }

      return result.caseInstance
    } catch (error) {
      console.error('Error creating case instance:', error)
      throw error
    }
  }

  /**
   * Create a case instance from a sample case
   */
  async createFromSampleCase(userId: string, sampleCaseId: string): Promise<CaseInstanceData> {
    const sampleCase = sampleCases.find(c => c.id === sampleCaseId)
    
    if (!sampleCase) {
      throw new Error(`Sample case not found: ${sampleCaseId}`)
    }

    const customCaseData = {
      title: sampleCase.title,
      description: sampleCase.description,
      difficulty: sampleCase.difficulty.toUpperCase(),
      specialty: sampleCase.specialty,
      estimatedTime: 25, // Default time
      learningObjectives: "Practice clinical reasoning and patient interaction",
      patientProfile: sampleCase.patientProfile,
      symptoms: sampleCase.symptoms,
      history: sampleCase.history,
      labs: sampleCase.labs,
      expectedQuestions: sampleCase.expectedQuestions
    }

    return this.createCaseInstance(userId, undefined, customCaseData)
  }

  /**
   * Create a case instance from custom generated case data
   */
  async createFromCustomCase(userId: string, customCaseData: any): Promise<CaseInstanceData> {
    // Ensure the custom case data matches the expected schema
    const formattedCaseData = {
      title: customCaseData.title || "Generated Case",
      description: customCaseData.description || "A medical case for learning",
      difficulty: this.normalizeDifficulty(customCaseData.difficulty),
      specialty: customCaseData.specialty || "General Medicine",
      estimatedTime: customCaseData.estimatedTime || 25,
      learningObjectives: customCaseData.learningObjectives || "Practice clinical reasoning and patient interaction",
      patientProfile: customCaseData.patientProfile || {
        name: "Patient",
        age: 45,
        gender: "Not specified",
        occupation: "Not specified"
      },
      symptoms: customCaseData.symptoms || [],
      history: customCaseData.history || [],
      labs: customCaseData.labs || {},
      expectedQuestions: customCaseData.expectedQuestions || []
    }
    
    return this.createCaseInstance(userId, undefined, formattedCaseData)
  }
  
  /**
   * Normalize difficulty to match API schema
   */
  private normalizeDifficulty(difficulty: string): string {
    if (!difficulty) return 'BEGINNER'
    
    const difficultyMap: Record<string, string> = {
      'beginner': 'BEGINNER',
      'intermediate': 'INTERMEDIATE', 
      'advanced': 'ADVANCED',
      'expert': 'EXPERT',
      'BEGINNER': 'BEGINNER',
      'INTERMEDIATE': 'INTERMEDIATE',
      'ADVANCED': 'ADVANCED',
      'EXPERT': 'EXPERT'
    }
    
    return difficultyMap[difficulty.toLowerCase()] || 'BEGINNER'
  }

  /**
   * Get case instances for a user
   */
  async getUserCaseInstances(userId: string): Promise<CaseInstanceData[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/case-instances?userId=${userId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch case instances: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch case instances')
      }

      return result.caseInstances
    } catch (error) {
      console.error('Error fetching case instances:', error)
      throw error
    }
  }

  /**
   * Get a specific case instance
   */
  async getCaseInstance(caseInstanceId: string): Promise<CaseInstanceData> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/cases/${caseInstanceId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch case instance: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch case instance')
      }

      return result.case
    } catch (error) {
      console.error('Error fetching case instance:', error)
      throw error
    }
  }
}

export const caseInstanceService = new CaseInstanceService()
