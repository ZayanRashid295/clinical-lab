export type MedprepSession = {
  id: string
  userId: string
  mode: "PRACTICE" | "LEARNING" | "EVALUATION" | "SHADOW"
  status: "ACTIVE" | "COMPLETED" | "ABANDONED"
  caseId?: string
  title?: string
  updatedAt?: string
}

function normalizeSession(raw: Record<string, unknown>): MedprepSession {
  const caseIdRaw = raw.caseId
  const inst = raw.caseInstanceId
  const caseId =
    caseIdRaw != null && String(caseIdRaw).trim() !== ""
      ? String(caseIdRaw)
      : inst != null && String(inst).trim() !== ""
        ? String(inst)
        : undefined
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    mode: String(raw.mode ?? "PRACTICE").toUpperCase() as MedprepSession["mode"],
    status: String(raw.status ?? "ACTIVE").toUpperCase() as MedprepSession["status"],
    caseId,
    title: raw.title != null ? String(raw.title) : undefined,
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : undefined,
  }
}

class MedprepSessionService {
  async listSessions(
    userId: string,
    opts?: { status?: MedprepSession["status"] | null; summary?: boolean },
  ): Promise<MedprepSession[]> {
    if (!userId || userId === "anonymous") return []
    const q = new URLSearchParams({ userId })
    if (opts?.summary !== false) q.set("summary", "1")
    if (opts?.status !== null) {
      q.set("status", opts?.status ?? "ACTIVE")
    }
    const response = await fetch(`/api/conversations?${q.toString()}`)
    const data = await response.json()
    if (!data.success) return []
    const rows = Array.isArray(data.conversations) ? data.conversations : []
    return rows.map((c: Record<string, unknown>) => normalizeSession(c))
  }

  getContinueUrl(session: MedprepSession): string {
    const caseId = session.caseId || "unknown"
    if (session.mode === "LEARNING") return `/medprep-ai/learn/${encodeURIComponent(caseId)}?conversationId=${encodeURIComponent(session.id)}`
    if (session.mode === "EVALUATION") return `/medprep-ai/evaluation?conversationId=${encodeURIComponent(session.id)}&caseId=${encodeURIComponent(caseId)}`
    if (session.mode === "SHADOW")
      return `/medprep-ai/shadow-play?conversationId=${encodeURIComponent(session.id)}&caseId=${encodeURIComponent(caseId)}`
    return `/medprep-ai/case/${encodeURIComponent(caseId)}?conversationId=${encodeURIComponent(session.id)}`
  }
}

export const medprepSessionService = new MedprepSessionService()
