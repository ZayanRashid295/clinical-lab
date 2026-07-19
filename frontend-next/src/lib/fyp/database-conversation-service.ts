import type { Conversation, ChatMessage, MedicalCase } from "./data-models"
import { parseFetchJson } from "@/lib/api/parse-fetch-json"
import { MedPrepConversationRequestError } from "./medprep-conversation-errors"

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
      return process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3001'
    }
  }

  // Create a new conversation
  async createConversation(
    userId: string,
    caseId: string,
    patientName?: string,
    caseTitle?: string,
    opts?: {
      mode?: "PRACTICE" | "LEARNING" | "EVALUATION" | "SHADOW"
      caseSnapshot?: MedicalCase | Record<string, unknown>
      isGeneratedCase?: boolean
      caseInstanceId?: string
    },
  ): Promise<Conversation> {
    try {
      const requestBody: Record<string, unknown> = {
        userId,
        caseId,
        mode: opts?.mode ?? "PRACTICE",
      }
      if (patientName) {
        requestBody.patientName = patientName
      }
      if (caseTitle) {
        requestBody.caseTitle = caseTitle
      }
      if (opts?.caseSnapshot) {
        requestBody.caseSnapshot = opts.caseSnapshot
      }
      if (opts?.isGeneratedCase !== undefined) {
        requestBody.isGeneratedCase = opts.isGeneratedCase
      }
      if (opts?.caseInstanceId) {
        requestBody.caseInstanceId = opts.caseInstanceId
      }
      
      const baseUrl = this.getBaseUrl()
      const response = await fetch(`${baseUrl}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const responseText = await response.text()

      let data: {
        success?: boolean
        error?: string
        message?: string
        conversation?: DatabaseConversation
        [key: string]: unknown
      } | null = null
      try {
        data = responseText?.trim() ? JSON.parse(responseText) : null
      } catch {
        if (!response.ok) {
          throw new MedPrepConversationRequestError(
            responseText || `Request failed (${response.status})`,
            response.status
          )
        }
        throw new MedPrepConversationRequestError('Invalid JSON response from server', response.status)
      }

      if (!response.ok) {
        const msg =
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.error === 'string' && data.error) ||
          responseText ||
          `Request failed (${response.status})`
        const payload =
          data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : null
        throw new MedPrepConversationRequestError(msg, response.status, {
          code: typeof data?.error === 'string' ? data.error : undefined,
          payload,
        })
      }

      if (!responseText?.trim()) {
        throw new MedPrepConversationRequestError('Empty response from server', response.status)
      }

      if (!data?.success || !data.conversation) {
        const msg =
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.error === 'string' && data.error) ||
          'Failed to create conversation'
        throw new MedPrepConversationRequestError(msg, response.status, {
          code: typeof data?.error === 'string' ? data.error : undefined,
          payload: data ? { ...data } : null,
        })
      }

      return this.convertDatabaseConversation(data.conversation)
    } catch (error) {
      if (MedPrepConversationRequestError.is(error)) {
        console.warn('[databaseConversationService.createConversation]', error.status, error.message)
        throw error
      }
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  // Add a message to the conversation
  async addMessage(
    conversationId: string,
    message: Omit<ChatMessage, "id" | "timestamp">,
    userId?: string
  ): Promise<ChatMessage> {
    try {
      const resolvedUserId = userId || "anonymous"
      const baseUrl = this.getBaseUrl()
      const response = await fetch(
        `${baseUrl}/api/conversations/${conversationId}/messages?userId=${encodeURIComponent(resolvedUserId)}`,
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: message.role.toUpperCase(),
          content: message.content,
          isIntervention: message.isIntervention || false,
          relevanceScore: message.relevanceScore
        })
      }
      )

      const data = await parseFetchJson<{
        success?: boolean
        error?: string
        message?: { id: string; createdAt: string }
      }>(response)

      if (!data?.success || !data.message) {
        throw new Error(data?.error || "Failed to add message")
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
  async getConversation(conversationId: string, userId?: string): Promise<Conversation | null> {
    try {
      const resolvedUserId = userId || "anonymous"
      const baseUrl = this.getBaseUrl()
      const response = await fetch(
        `${baseUrl}/api/conversations/${conversationId}?userId=${encodeURIComponent(resolvedUserId)}`
      )

      const data = await parseFetchJson<{
        success?: boolean
        error?: string
        conversation?: DatabaseConversation
      }>(response)
      if (!data) return null

      if (!data.success || !data.conversation) {
        // 401/403/404: subscription, ownership, or missing session — resume without throwing (Next dev overlay surfaces thrown Errors).
        if ([401, 403, 404].includes(response.status)) {
          return null
        }
        console.warn(
          "[databaseConversationService.getConversation] unavailable:",
          response.status,
          data.error
        )
        return null
      }

      try {
        return this.convertDatabaseConversation(data.conversation)
      } catch (parseErr) {
        console.warn("[databaseConversationService.getConversation] invalid payload:", parseErr)
        return null
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const isNetwork =
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("Load failed")
      if (isNetwork) {
        console.warn("[databaseConversationService.getConversation] network:", msg)
      } else {
        console.warn("[databaseConversationService.getConversation]", msg)
      }
      return null
    }
  }

  // Complete a conversation
  async completeConversation(conversationId: string, userId?: string): Promise<void> {
    try {
      const resolvedUserId = userId || "anonymous"
      const baseUrl = this.getBaseUrl()
      const response = await fetch(
        `${baseUrl}/api/conversations/${conversationId}?userId=${encodeURIComponent(resolvedUserId)}`,
        {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resolvedUserId,
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        })
      }
      )

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
    const rows = Array.isArray(dbConv.messages) ? dbConv.messages : []
    return {
      id: dbConv.id,
      studentId: dbConv.userId,
      caseId: resolvedCaseId,
      messages: rows.map(msg => ({
        id: msg.id,
        role: (msg.role ?? "STUDENT").toLowerCase() as 'student' | 'patient' | 'doctor',
        content: msg.content ?? "",
        timestamp: msg.createdAt ?? new Date().toISOString(),
        isIntervention: msg.isIntervention,
        relevanceScore: msg.relevanceScore
      })),
      status: (dbConv.status ?? "ACTIVE").toLowerCase() as 'active' | 'completed' | 'abandoned',
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
    } catch (error) {
      console.error('Error clearing conversations:', error)
    }
  }
}

export const databaseConversationService = new DatabaseConversationService()
