export type MedprepSession = {
  id: string
  userId: string
  mode: "PRACTICE" | "LEARNING" | "EVALUATION"
  status: "ACTIVE" | "COMPLETED" | "ABANDONED"
  caseId?: string
  title?: string
  updatedAt?: string
}

function normalizeSession(raw: Record<string, unknown>): MedprepSession {
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    mode: String(raw.mode ?? "PRACTICE").toUpperCase() as MedprepSession["mode"],
    status: String(raw.status ?? "ACTIVE").toUpperCase() as MedprepSession["status"],
    caseId: raw.caseId != null ? String(raw.caseId) : undefined,
    title: raw.title != null ? String(raw.title) : undefined,
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : undefined,
  }
}

class MedprepSessionService {
  async listSessions(userId: string): Promise<MedprepSession[]> {
    if (!userId || userId === "anonymous") return []
    const response = await fetch(`/api/conversations?userId=${encodeURIComponent(userId)}`)
    const data = await response.json()
    if (!data.success) return []
    const rows = Array.isArray(data.conversations) ? data.conversations : []
    return rows.map((c: Record<string, unknown>) => normalizeSession(c))
  }

  getContinueUrl(session: MedprepSession): string {
    const caseId = session.caseId || "unknown"
    if (session.mode === "LEARNING") return `/medprep-ai/learn/${encodeURIComponent(caseId)}?conversationId=${encodeURIComponent(session.id)}`
    if (session.mode === "EVALUATION") return `/medprep-ai/evaluation?conversationId=${encodeURIComponent(session.id)}&caseId=${encodeURIComponent(caseId)}`
    return `/medprep-ai/case/${encodeURIComponent(caseId)}?conversationId=${encodeURIComponent(session.id)}`
  }
}

export const medprepSessionService = new MedprepSessionService()
