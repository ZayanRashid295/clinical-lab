/**
 * In-memory persistence for MedPrep practice/learning API routes.
 * Survives for the lifetime of the Node dev server process (resets on restart).
 */
export type MedprepMessageRole = "STUDENT" | "PATIENT" | "DOCTOR"

export type MedprepStoredMessage = {
  id: string
  role: MedprepMessageRole
  content: string
  isIntervention: boolean
  relevanceScore?: number
  createdAt: string
}

export type MedprepStoredConversation = {
  id: string
  status: "ACTIVE" | "COMPLETED" | "ABANDONED"
  startedAt: string
  completedAt?: string
  interventionCount: number
  userId: string
  caseId?: string
  caseInstanceId?: string
  messages: MedprepStoredMessage[]
}

const g = globalThis as unknown as { __medprepConversationStore?: Map<string, MedprepStoredConversation> }

export function getMedprepConversationStore(): Map<string, MedprepStoredConversation> {
  if (!g.__medprepConversationStore) {
    g.__medprepConversationStore = new Map()
  }
  return g.__medprepConversationStore
}

export function newMedprepId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}
