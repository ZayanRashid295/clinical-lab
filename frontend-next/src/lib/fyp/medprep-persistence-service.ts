/**
 * MedPrepAI — database-backed persistence (via Nest `/medprep-ai/*` through Next API proxies).
 * All modes share `medprep_conversations`, messages, SOAP notes, diagnosis, and hint sessions.
 */

import type { MedicalCase } from "./data-models"
import { parseFetchJson } from "@/lib/api/parse-fetch-json"
import { authService } from "@/shared/services/auth.service"
import { getClinicalUserId } from "./medprep-user"

export type MedprepMode = "PRACTICE" | "LEARNING" | "EVALUATION" | "SHADOW"
export type MedprepSessionStatus = "ACTIVE" | "COMPLETED" | "ABANDONED"

export interface MedprepSoapDraft {
  id?: string
  conversationId: string
  userId: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  grade?: number | null
  feedback?: string | null
  submittedAt?: string | null
  aiGeneratedSOAP?: {
    subjective?: string
    objective?: string
    assessment?: string
    plan?: string
  }
}

export interface MedprepSessionRecord {
  id: string
  userId: string
  mode: MedprepMode
  status: MedprepSessionStatus
  caseId?: string | null
  caseInstanceId?: string | null
  title?: string | null
  score?: number | null
  metadata?: Record<string, unknown> | null
  messages?: Array<Record<string, unknown>>
  soapNotes?: Array<Record<string, unknown>>
  hintSessions?: Array<Record<string, unknown>>
  diagnosisSubmissions?: Array<Record<string, unknown>>
}

function apiBase(): string {
  if (typeof window !== "undefined") return window.location.origin
  return process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3001"
}

export function resolveMedprepUserId(): string | null {
  const id = getClinicalUserId(authService.getCurrentUser())
  if (!id || id === "anonymous") return null
  return id
}

export async function fetchMedprepSession(
  conversationId: string,
  userId: string,
): Promise<MedprepSessionRecord | null> {
  const response = await fetch(
    `${apiBase()}/api/conversations/${encodeURIComponent(conversationId)}?userId=${encodeURIComponent(userId)}`,
  )
  const data = await parseFetchJson<{ success?: boolean; conversation?: MedprepSessionRecord }>(
    response,
  )
  if (!response.ok || !data?.success || !data.conversation) return null
  return data.conversation
}

export async function fetchResumeSession(
  userId: string,
  mode: MedprepMode,
  caseId?: string,
): Promise<MedprepSessionRecord | null> {
  const q = new URLSearchParams({ userId, mode })
  if (caseId) q.set("caseId", caseId)
  const response = await fetch(`${apiBase()}/api/conversations/resume?${q}`)
  const data = await parseFetchJson<{ success?: boolean; session?: MedprepSessionRecord | null }>(
    response,
  )
  if (!response.ok || !data?.success) return null
  return data.session ?? null
}

export async function startMedprepSession(input: {
  userId: string
  mode: MedprepMode
  caseId: string
  caseInstanceId?: string
  title?: string
  isGeneratedCase?: boolean
  caseSnapshot?: MedicalCase | Record<string, unknown>
  metadata?: Record<string, unknown>
}): Promise<MedprepSessionRecord | null> {
  const response = await fetch(`${apiBase()}/api/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: input.userId,
      mode: input.mode,
      caseId: input.caseId,
      caseInstanceId: input.caseInstanceId,
      caseTitle: input.title,
      isGeneratedCase: input.isGeneratedCase,
      caseSnapshot: input.caseSnapshot,
      metadata: input.metadata,
    }),
  })
  const data = await parseFetchJson<{ success?: boolean; conversation?: MedprepSessionRecord }>(
    response,
  )
  if (!response.ok || !data?.success || !data.conversation) return null
  return data.conversation
}

export async function patchMedprepSession(
  conversationId: string,
  userId: string,
  patch: {
    status?: MedprepSessionStatus
    score?: number
    title?: string
    metadata?: Record<string, unknown>
  },
): Promise<boolean> {
  const response = await fetch(
    `${apiBase()}/api/conversations/${encodeURIComponent(conversationId)}?userId=${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    },
  )
  const data = await parseFetchJson<{ success?: boolean }>(response)
  return Boolean(response.ok && data?.success)
}

export function soapFromSessionRecord(
  session: MedprepSessionRecord,
): MedprepSoapDraft | null {
  const row = session.soapNotes?.[0]
  if (!row) return null
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    conversationId:
      typeof row.conversationId === "string" ? row.conversationId : session.id,
    userId: typeof row.userId === "string" ? row.userId : session.userId,
    subjective: String(row.subjective ?? ""),
    objective: String(row.objective ?? ""),
    assessment: String(row.assessment ?? ""),
    plan: String(row.plan ?? ""),
    grade: typeof row.grade === "number" ? row.grade : null,
    feedback: typeof row.feedback === "string" ? row.feedback : null,
    submittedAt:
      typeof row.submittedAt === "string"
        ? row.submittedAt
        : typeof row.lastSavedAt === "string"
          ? row.lastSavedAt
          : null,
    aiGeneratedSOAP: {
      subjective: String(row.aiSubjective ?? ""),
      objective: String(row.aiObjective ?? ""),
      assessment: String(row.aiAssessment ?? ""),
      plan: String(row.aiPlan ?? ""),
    },
  }
}

export async function fetchSoapDraft(
  conversationId: string,
  userId: string,
): Promise<MedprepSoapDraft | null> {
  const response = await fetch(
    `${apiBase()}/api/soap/get?conversationId=${encodeURIComponent(conversationId)}&userId=${encodeURIComponent(userId)}`,
  )
  const data = await parseFetchJson<{ success?: boolean; soapNote?: Record<string, unknown> }>(
    response,
  )
  if (!response.ok || !data?.success || !data.soapNote) return null
  const n = data.soapNote
  return {
    id: n.id,
    conversationId: n.conversationId || conversationId,
    userId: n.studentId || userId,
    subjective: String(n.subjective ?? ""),
    objective: String(n.objective ?? ""),
    assessment: String(n.assessment ?? ""),
    plan: String(n.plan ?? ""),
    grade: typeof n.grade === "number" ? n.grade : null,
    feedback: n.feedback ?? null,
    submittedAt: n.submittedAt ?? null,
    aiGeneratedSOAP: n.aiGeneratedSOAP,
  }
}

export async function saveSoapDraft(
  draft: MedprepSoapDraft,
  opts?: { submit?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const userId = draft.userId
  if (!userId || userId === "anonymous") {
    return { ok: false, error: "Sign in to save your SOAP note to your account." }
  }
  const response = await fetch(`${apiBase()}/api/soap/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: draft.id,
      conversationId: draft.conversationId,
      studentId: userId,
      subjective: draft.subjective,
      objective: draft.objective,
      assessment: draft.assessment,
      plan: draft.plan,
      aiGeneratedSOAP: draft.aiGeneratedSOAP,
      grade: opts?.submit ? draft.grade : undefined,
      feedback: opts?.submit ? draft.feedback : undefined,
    }),
  })
  const data =
    (await parseFetchJson<{ details?: string; error?: string }>(response)) ?? {}
  if (!response.ok) {
    const isHtml = !response.headers.get("content-type")?.includes("json")
    return {
      ok: false,
      error:
        (typeof data.details === "string" && data.details) ||
        (typeof data.error === "string" && data.error) ||
        (isHtml
          ? `Save failed — server returned HTML (${response.status}). Check API route / backend.`
          : `Save failed (${response.status})`),
    }
  }
  return { ok: true }
}

export function caseSnapshotFromSession(
  session: MedprepSessionRecord,
): MedicalCase | null {
  const meta = session.metadata
  if (!meta || typeof meta !== "object") return null
  const snap = (meta as { caseSnapshot?: unknown }).caseSnapshot
  if (!snap || typeof snap !== "object") return null
  const c = snap as MedicalCase
  if (!c.id) return null
  return c
}

export async function ensureCaseSnapshotOnSession(
  conversationId: string,
  userId: string,
  medicalCase: MedicalCase,
): Promise<void> {
  const session = await fetchMedprepSession(conversationId, userId)
  if (!session) return
  const existing = caseSnapshotFromSession(session)
  if (existing?.id === medicalCase.id) return
  await patchMedprepSession(conversationId, userId, {
    metadata: {
      ...(session.metadata && typeof session.metadata === "object"
        ? (session.metadata as Record<string, unknown>)
        : {}),
      caseSnapshot: medicalCase,
    },
  })
}

export async function upsertHintSession(
  conversationId: string,
  userId: string,
  payload: {
    sessionKey: string
    caseId?: string
    totalHintsUsed: number
    highImportanceHints: number
    mediumImportanceHints: number
    lowImportanceHints: number
    gradePenalty: number
    hintTimestamps?: string[]
    hintsByCategory?: Record<string, number>
  },
): Promise<boolean> {
  const response = await fetch(`${apiBase()}/api/medprep/hints`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      userId,
      ...payload,
    }),
  })
  const data = await parseFetchJson<{ success?: boolean }>(response)
  return Boolean(response.ok && data?.success)
}
