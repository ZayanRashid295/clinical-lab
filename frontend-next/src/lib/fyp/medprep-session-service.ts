export type MedprepSession = {
  id: string
  userId: string
  mode: "PRACTICE" | "LEARNING" | "EVALUATION"
  status: "ACTIVE" | "COMPLETED" | "ABANDONED"
  caseId?: string
  title?: string
  updatedAt?: string
}

class MedprepSessionService {
  async listSessions(userId: string): Promise<MedprepSession[]> {
    if (!userId) return []
    const response = await fetch(`/api/conversations?userId=${encodeURIComponent(userId)}`)
    const data = await response.json()
    if (!data.success) return []
    return (data.conversations || []) as MedprepSession[]
  }

  getContinueUrl(session: MedprepSession): string {
    const caseId = session.caseId || "unknown"
    if (session.mode === "LEARNING") return `/medprep-ai/learn/${encodeURIComponent(caseId)}?conversationId=${encodeURIComponent(session.id)}`
    if (session.mode === "EVALUATION") return `/medprep-ai/evaluation?conversationId=${encodeURIComponent(session.id)}&caseId=${encodeURIComponent(caseId)}`
    return `/medprep-ai/case/${encodeURIComponent(caseId)}?conversationId=${encodeURIComponent(session.id)}`
  }
}

export const medprepSessionService = new MedprepSessionService()
