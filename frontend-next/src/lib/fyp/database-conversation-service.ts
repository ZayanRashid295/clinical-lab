import type { Conversation, ChatMessage, MedicalCase } from "./data-models"

interface DatabaseConversation {
  id: string
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
  startedAt: string
  completedAt?: string
  interventionCount: number
  userId: string
  caseId?: string
  caseInstanceId?: string
  messages: DatabaseMessage[]
  case?: {
    id: string
    title: string
    difficulty: string
    specialty: string
  }
  caseInstance?: {
    id: string
    title: string
    difficulty: string
    specialty: string
  }
  user?: {
    id: string
    name: string
    email: string
  }
}

interface DatabaseMessage {
  id: string
  role: 'STUDENT' | 'PATIENT' | 'DOCTOR'
  content: string
  isIntervention: boolean
  relevanceScore?: number
  createdAt: string
}

class DatabaseConversationService {
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      return window.location.origin
    } else {
      // Server-side: use environment variable or default
      return process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    }
  }

  // Create a new conversation
  async createConversation(userId: string, caseId: string, patientName?: string, caseTitle?: string): Promise<Conversation> {
    try {
      const requestBody: any = { userId, caseId }
      if (patientName) {
        requestBody.patientName = patientName
      }
      if (caseTitle) {
        requestBody.caseTitle = caseTitle
      }
      
      const baseUrl = this.getBaseUrl()
      const response = await fetch(`${baseUrl}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const responseText = await response.text()
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server')
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError)
        console.error('Response text was:', responseText)
        throw new Error('Invalid JSON response from server')
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create conversation')
      }

      return this.convertDatabaseConversation(data.conversation)
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  // Add a message to the conversation
  async addMessage(conversationId: string, message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage> {
    try {
      const baseUrl = this.getBaseUrl()
      const response = await fetch(`${baseUrl}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: message.role.toUpperCase(),
          content: message.content,
          isIntervention: message.isIntervention || false,
          relevanceScore: message.relevanceScore
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to add message')
      }

      return {
        id: data.message.id,
        role: message.role,
        content: message.content,
        timestamp: data.message.createdAt,
        isIntervention: message.isIntervention,
        relevanceScore: message.relevanceScore
      }
    } catch (error) {
      console.error('Error adding message:', error)
      throw error
    }
  }

  // Get conversation by ID
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const baseUrl = this.getBaseUrl()
      const response = await fetch(`${baseUrl}/api/conversations/${conversationId}`)
      const data = await response.json()
      
      if (!data.success) {
        if (response.status === 404) {
          return null
        }
        throw new Error(data.error || 'Failed to get conversation')
      }

      return this.convertDatabaseConversation(data.conversation)
    } catch (error) {
      console.error('Error getting conversation:', error)
      return null
    }
  }

  // Complete a conversation
  async completeConversation(conversationId: string): Promise<void> {
    try {
      const baseUrl = this.getBaseUrl()
      const response = await fetch(`${baseUrl}/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to complete conversation')
      }
    } catch (error) {
      console.error('Error completing conversation:', error)
      throw error
    }
  }

  // Get all conversations for a student
  async getStudentConversations(studentId: string): Promise<Conversation[]> {
    try {
      const baseUrl = this.getBaseUrl()
      const response = await fetch(`${baseUrl}/api/conversations?userId=${studentId}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get student conversations')
      }

      return data.conversations.map((conv: DatabaseConversation) => 
        this.convertDatabaseConversation(conv)
      )
    } catch (error) {
      console.error('Error getting student conversations:', error)
      return []
    }
  }

  // Get conversations by case
  async getConversationsByCase(caseId: string): Promise<Conversation[]> {
    try {
      const baseUrl = this.getBaseUrl()
      const response = await fetch(`${baseUrl}/api/conversations?caseId=${caseId}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get conversations by case')
      }

      return data.conversations.map((conv: DatabaseConversation) => 
        this.convertDatabaseConversation(conv)
      )
    } catch (error) {
      console.error('Error getting conversations by case:', error)
      return []
    }
  }

  // Convert database conversation to app conversation format
  private convertDatabaseConversation(dbConv: DatabaseConversation): Conversation {
    const resolvedCaseId = dbConv.caseId || dbConv.caseInstanceId || ''
    return {
      id: dbConv.id,
      studentId: dbConv.userId,
      caseId: resolvedCaseId,
      messages: dbConv.messages.map(msg => ({
        id: msg.id,
        role: msg.role.toLowerCase() as 'student' | 'patient' | 'doctor',
        content: msg.content,
        timestamp: msg.createdAt,
        isIntervention: msg.isIntervention,
        relevanceScore: msg.relevanceScore
      })),
      status: dbConv.status.toLowerCase() as 'active' | 'completed' | 'abandoned',
      startedAt: dbConv.startedAt,
      completedAt: dbConv.completedAt,
      interventionCount: dbConv.interventionCount
    }
  }

  // Debug method to get all conversations
  async getAllConversations(): Promise<Conversation[]> {
    try {
      // This would need a separate API endpoint for admin use
      // For now, return empty array
      return []
    } catch (error) {
      console.error('Error getting all conversations:', error)
      return []
    }
  }

  // Debug method to clear all conversations (admin only)
  async clearAllConversations(): Promise<void> {
    try {
      // This would need a separate API endpoint for admin use
      console.log('Clear all conversations not implemented for database service')
    } catch (error) {
      console.error('Error clearing conversations:', error)
    }
  }
}

export const databaseConversationService = new DatabaseConversationService()
