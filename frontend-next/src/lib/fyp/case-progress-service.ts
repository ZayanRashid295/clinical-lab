import type { MedicalCase, Conversation } from "./data-models"

interface CaseProgressData {
  userId: string
  caseInstanceId: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  score?: number
  timeSpent?: number
  hintsUsed?: number
  attempts?: number
  feedback?: string
}

class CaseProgressService {
  // Update case progress
  async updateCaseProgress(progressData: CaseProgressData): Promise<void> {
    try {
      // Check if progress already exists
      const baseUrl = this.getBaseUrl()
      const existingResponse = await fetch(`${baseUrl}/api/case-progress?userId=${progressData.userId}&caseInstanceId=${progressData.caseInstanceId}`)
      const existingData = await existingResponse.json()
      
      let response
      if (existingData.success && existingData.caseProgress.length > 0) {
        // Update existing progress
        const existingProgress = existingData.caseProgress[0]
        response = await fetch(`${baseUrl}/api/case-progress/${existingProgress.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: progressData.status,
            score: progressData.score,
            timeSpent: progressData.timeSpent,
            feedback: progressData.feedback
          })
        })
      } else {
        // Create new progress
        const baseUrl = this.getBaseUrl()
        response = await fetch(`${baseUrl}/api/case-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progressData)
        })
      }

      if (!response.ok) {
        throw new Error(`Failed to update case progress: ${response.statusText}`)
      }

      console.log('Case progress updated successfully')
    } catch (error) {
      console.error('Error updating case progress:', error)
    }
  }

  // Get case progress for a user and case
  async getCaseProgress(userId: string, caseInstanceId: string): Promise<any | null> {
    try {
      const baseUrl = this.getBaseUrl()
      const response = await fetch(`${baseUrl}/api/case-progress?userId=${userId}&caseInstanceId=${caseInstanceId}`)
      const data = await response.json()
      
      if (data.success && data.caseProgress.length > 0) {
        return data.caseProgress[0]
      }
      
      return null
    } catch (error) {
      console.error('Error getting case progress:', error)
      return null
    }
  }

  // Mark case as started
  async startCase(userId: string, caseInstanceId: string): Promise<void> {
    await this.updateCaseProgress({
      userId,
      caseInstanceId,
      status: 'IN_PROGRESS',
      timeSpent: 0
    })
  }

  // Mark case as completed
  async completeCase(userId: string, caseInstanceId: string, score?: number, timeSpent?: number): Promise<void> {
    await this.updateCaseProgress({
      userId,
      caseInstanceId,
      status: 'COMPLETED',
      score,
      timeSpent
    })
  }

  // Update hints used
  async updateHintsUsed(userId: string, caseId: string, hintsUsed: number): Promise<void> {
    const existingProgress = await this.getCaseProgress(userId, caseId)
    if (existingProgress) {
      await this.updateCaseProgress({
        userId,
        caseId,
        status: existingProgress.status,
        score: existingProgress.score,
        timeSpent: existingProgress.timeSpent,
        hintsUsed,
        attempts: existingProgress.attempts,
        feedback: existingProgress.feedback
      })
    }
  }

  // Helper method to find case ID from conversation (similar to SOAP service)
  private async findCaseIdFromConversation(conversationId: string): Promise<string | null> {
    try {
      console.log('🔍 Looking for case ID for conversation:', conversationId)
      
      // Try to get the conversation from the database
      const baseUrl = this.getBaseUrl()
      const response = await fetch(`${baseUrl}/api/conversations/${conversationId}`)
      const data = await response.json()
      
      if (data.success && data.conversation) {
        console.log('✅ Found conversation in database:', data.conversation.caseInstanceId)
        return data.conversation.caseInstanceId
      }
      
      // If not found in database, try localStorage as fallback
      if (typeof window !== 'undefined') {
        const conversationData = localStorage.getItem('medical-app-conversations')
        if (conversationData) {
          const conversations = JSON.parse(conversationData)
          const conversation = conversations.find((c: any) => c.id === conversationId)
          if (conversation && (conversation.caseInstanceId || conversation.caseId)) {
            const convCase = conversation.caseInstanceId || conversation.caseId
            console.log('✅ Found conversation in localStorage:', convCase)
            return convCase
          }
        }
      }
      
      // If still not found, use fallback
      console.log('⚠️ Conversation not found, using fallback case')
      return null
      
      return null
    } catch (error) {
      console.error('Error finding case ID from conversation:', error)
      return null
    }
  }

  // Helper method to get the base URL for API calls
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      return window.location.origin
    } else {
      // Server-side: use environment variable or default
      return process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:52941'
    }
  }

  // Helper method to find matching database case
  private async findMatchingDatabaseCase(conversationCaseId: string): Promise<string | null> {
    try {
      const baseUrl = this.getBaseUrl()
      const casesResponse = await fetch(`${baseUrl}/api/cases`)
      const casesData = await casesResponse.json()
      
      if (casesData.success && casesData.cases.length > 0) {
        const matchingCase = casesData.cases.find((c: any) => {
          const caseIdentifier = `${c.id}_${c.title}_${c.specialty || ''}`.replace(/\s+/g, '_')
          return conversationCaseId === c.id || 
                 conversationCaseId === c.title ||
                 conversationCaseId === caseIdentifier ||
                 conversationCaseId.includes(c.id) ||
                 conversationCaseId.includes(c.title)
        })
        
        if (matchingCase) {
          return matchingCase.id
        }
        
        // Fallback to first case
        return casesData.cases[0].id
      }
      
      return null
    } catch (error) {
      console.error('Error finding matching database case:', error)
      return null
    }
  }
}

export const caseProgressService = new CaseProgressService()
