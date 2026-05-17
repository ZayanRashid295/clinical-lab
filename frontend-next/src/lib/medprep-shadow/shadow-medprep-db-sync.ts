import { safeClientFetch } from "@/lib/api/safe-client-fetch"
import type {
  LearningSession,
  LearningConversationMessage,
} from "@/lib/medprep-shadow/learning-types"
import type { DifferentialDiagnosisItem } from "@/lib/medprep-shadow/services/differential-diagnosis.service"

/** One step for manual-mode Back / Next (rebuilt on resume from DB transcript). */
export type ShadowManualConversationState = {
  messages: LearningConversationMessage[]
  thoughts: Array<{ time: string; thought: string; apiTime?: number; loading?: boolean }>
  diagnosis: DifferentialDiagnosisItem[]
  timestamp: string
}

type CaseSnapshotInput = {
  id: string | number
  disease: string
  title?: string
  specialty?: string
}

export type CreateShadowMedprepSessionResult =
  | { ok: true; conversationId: string }
  | { ok: false; status: number; message: string }

/**
 * Creates (or resumes) an ACTIVE SHADOW MedPrep row via Next `/api/conversations` → Nest `POST /medprep-ai/sessions`.
 * Always stringifies `caseId` so numeric/generated ids match MySQL and the API contract.
 */
export async function createShadowMedprepSession(opts: {
  userId: string
  caseId: string | number
  medicalCase: CaseSnapshotInput
  isGeneratedCase?: boolean
}): Promise<CreateShadowMedprepSessionResult> {
  const caseId = String(opts.caseId).trim()
  if (!caseId) {
    return { ok: false, status: 400, message: "caseId is required" }
  }
  const mc = opts.medicalCase
  const titleSource =
    mc.title != null && String(mc.title).trim() !== ""
      ? String(mc.title)
      : String(mc.disease ?? caseId)
  const caseTitle = titleSource.slice(0, 255)

  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: opts.userId,
      caseId,
      mode: "SHADOW",
      caseTitle,
      ...(opts.isGeneratedCase === true ? { isGeneratedCase: true } : {}),
      caseSnapshot: {
        id: mc.id,
        disease: mc.disease,
        specialty: mc.specialty,
      },
    }),
  })

  const raw = await res.text().catch(() => "")
  type CreateResp = {
    success?: boolean
    conversation?: { id?: string }
    message?: string
    error?: string
    id?: string
  }
  let data: CreateResp | null = null
  try {
    data = raw?.trim() ? (JSON.parse(raw) as CreateResp) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      raw.slice(0, 400) ||
      `Request failed (${res.status})`
    return { ok: false, status: res.status, message: String(message) }
  }

  const id =
    data && typeof data === "object"
      ? data.conversation?.id ?? data.id
      : undefined
  if (!id) {
    return { ok: false, status: 502, message: "Missing conversation id in API response" }
  }
  return { ok: true, conversationId: String(id) }
}

const MAX_SHADOW_THOUGHT_CHARS = 24_000
const MAX_SHADOW_DD_ITEMS = 24
const MAX_SHADOW_INTERVENTIONS = 48
const MAX_SHADOW_INTERVENTION_FIELD = 4000

export type ShadowSupervisorIntervention = {
  id: string
  timestamp: string
  role: "doctor" | "student" | "patient"
  question: string
  messageId?: string
  reason: string
  content: string
}

function normalizeInterventionRole(raw: unknown): ShadowSupervisorIntervention["role"] {
  const r = String(raw ?? "").toLowerCase()
  if (r === "student") return "student"
  if (r === "patient") return "patient"
  return "doctor"
}

/** Validates interventions loaded from DB metadata or session state. */
export function clampSupervisorInterventions(raw: unknown): ShadowSupervisorIntervention[] {
  if (!Array.isArray(raw)) return []
  const out: ShadowSupervisorIntervention[] = []
  for (let i = 0; i < raw.length && out.length < MAX_SHADOW_INTERVENTIONS; i++) {
    const item = raw[i]
    if (!item || typeof item !== "object" || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    const question = String(o.question ?? "").slice(0, MAX_SHADOW_INTERVENTION_FIELD)
    const reason = String(o.reason ?? "").slice(0, MAX_SHADOW_INTERVENTION_FIELD)
    const content = String(o.content ?? "").slice(0, MAX_SHADOW_INTERVENTION_FIELD)
    if (!reason.trim() && !content.trim()) continue
    const timestamp =
      typeof o.timestamp === "string" && o.timestamp
        ? o.timestamp
        : new Date().toISOString()
    out.push({
      id:
        typeof o.id === "string" && o.id
          ? o.id.slice(0, 120)
          : `intervention-restored-${i}`,
      timestamp,
      role: normalizeInterventionRole(o.role),
      question,
      ...(typeof o.messageId === "string" && o.messageId
        ? { messageId: o.messageId.slice(0, 120) }
        : {}),
      reason: reason || "Supervisor flag",
      content: content || "Continue with clinically relevant questions.",
    })
  }
  return out
}

export function parseShadowSupervisorInterventionsFromMetadata(
  convMetadata: unknown,
): ShadowSupervisorIntervention[] {
  const meta =
    convMetadata && typeof convMetadata === "object" && !Array.isArray(convMetadata)
      ? (convMetadata as Record<string, unknown>)
      : {}
  return clampSupervisorInterventions(meta.shadowSupervisorInterventions)
}

function parseSupervisorInterventionFromMessageMetadata(
  raw: unknown,
  fallback: { question: string; messageId?: string },
): ShadowSupervisorIntervention | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const reason = String(o.reason ?? "").trim()
  const content = String(o.content ?? "").trim()
  if (!reason && !content) return undefined
  return {
    id: typeof o.id === "string" && o.id ? o.id : `intervention-msg-${Date.now()}`,
    timestamp:
      typeof o.timestamp === "string" && o.timestamp
        ? o.timestamp
        : new Date().toISOString(),
    role: "student",
    question: fallback.question,
    ...(fallback.messageId ? { messageId: fallback.messageId } : {}),
    reason: reason || "Supervisor flag",
    content: content || "Continue with clinically relevant questions.",
  }
}

function findSupervisorInterventionForStudentMessage(
  session: LearningSession,
  message: LearningConversationMessage,
): ShadowSupervisorIntervention | undefined {
  const list = clampSupervisorInterventions(session.supervisorInterventions)
  const q = String(message.content ?? "").trim()
  return list.find(
    (iv) =>
      (message.id && iv.messageId === message.id) ||
      String(iv.question ?? "").trim() === q,
  )
}

function supervisorInterventionToMessageMetadata(
  iv: ShadowSupervisorIntervention,
): Record<string, unknown> {
  return {
    supervisorIntervention: {
      id: iv.id,
      timestamp: iv.timestamp,
      reason: iv.reason,
      content: iv.content,
    },
  }
}

export function mergeShadowSupervisorInterventions(
  existing: unknown,
  added: ShadowSupervisorIntervention,
): ShadowSupervisorIntervention[] {
  const prev = clampSupervisorInterventions(existing)
  if (prev.some((p) => p.id === added.id)) return prev
  const next = [...prev, added]
  if (next.length > MAX_SHADOW_INTERVENTIONS) {
    return next.slice(next.length - MAX_SHADOW_INTERVENTIONS)
  }
  return next
}

/** Union by id so partial session updates never drop saved interventions. */
export function unionSupervisorInterventions(
  ...lists: unknown[]
): ShadowSupervisorIntervention[] {
  const byId = new Map<string, ShadowSupervisorIntervention>()
  for (const list of lists) {
    for (const item of clampSupervisorInterventions(list)) {
      byId.set(item.id, item)
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )
}

/** Drop adjacent duplicate chat rows (legacy double-submit / Strict Mode). */
export function dedupeShadowConversationMessages(
  messages: LearningConversationMessage[],
): LearningConversationMessage[] {
  if (!messages.length) return messages
  const out: LearningConversationMessage[] = [messages[0]]
  for (let i = 1; i < messages.length; i++) {
    const cur = messages[i]
    const prev = out[out.length - 1]
    const sameRole = prev.role === cur.role
    const sameContent =
      String(prev.content ?? "").trim() === String(cur.content ?? "").trim()
    if (sameRole && sameContent) continue
    out.push(cur)
  }
  return out
}

type ShadowTurnEntry = {
  doctorThought?: string
  differentialDiagnosis?: unknown[]
}

export function formatSessionDoctorThoughts(
  raw: LearningSession["doctorThoughts"],
): ShadowManualConversationState["thoughts"] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const t = item as Record<string, unknown>
      const thought = String(t.content ?? t.thought ?? "").trim()
      if (!thought) return null
      return {
        time: String(t.timestamp ?? t.time ?? new Date().toISOString()),
        thought,
        ...(typeof t.apiTime === "number" ? { apiTime: t.apiTime } : {}),
      }
    })
    .filter((x): x is ShadowManualConversationState["thoughts"][number] => x != null)
}

/** Thought + DD snapshot after messages[0..endIdx] (uses per-doctor shadowTurn / turn map). */
export function buildShadowTurnSnapshotUpToIndex(
  conv: LearningConversationMessage[],
  endIdx: number,
  turnMap?: Record<string, ShadowTurnEntry>,
  fallbackThoughts: ShadowManualConversationState["thoughts"] = [],
  fallbackDiagnosis: DifferentialDiagnosisItem[] = [],
): {
  thoughts: ShadowManualConversationState["thoughts"]
  diagnosis: DifferentialDiagnosisItem[]
} {
  const thoughts: ShadowManualConversationState["thoughts"] = []
  let diagnosis = [...fallbackDiagnosis]
  let doctorIdx = 0

  for (let j = 0; j <= endIdx && j < conv.length; j++) {
    const msg = conv[j]
    if (String(msg.role ?? "").toLowerCase() !== "doctor") continue

    const fromMsg = msg.shadowTurn
    const fromMap = turnMap?.[String(doctorIdx)]
    const thoughtText =
      (fromMsg?.doctorThought?.trim() ||
        (typeof fromMap?.doctorThought === "string" ? fromMap.doctorThought.trim() : "")) ??
      ""
    if (thoughtText) {
      thoughts.push({
        time: new Date(msg.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        thought: thoughtText,
      })
    }

    const ddRaw =
      fromMsg?.differentialDiagnosis ??
      (Array.isArray(fromMap?.differentialDiagnosis) ? fromMap.differentialDiagnosis : undefined)
    if (ddRaw?.length) {
      const clamped = clampDifferentialDiagnosisRaw(ddRaw as unknown[])
      if (clamped.length) diagnosis = recordsToDdItems(clamped)
    }

    doctorIdx++
  }

  if (!thoughts.length && fallbackThoughts.length) {
    let doctorsSeen = 0
    for (let j = 0; j <= endIdx && j < conv.length; j++) {
      if (String(conv[j]?.role ?? "").toLowerCase() === "doctor") doctorsSeen++
    }
    return {
      thoughts: fallbackThoughts.slice(0, Math.max(doctorsSeen, 1)),
      diagnosis,
    }
  }

  return { thoughts, diagnosis }
}

/** Rebuild manual Back/Next history from a resumed MedPrep transcript. */
export function buildManualConversationStatesFromSession(
  session: LearningSession,
  opts?: { skipEmptyInitialState?: boolean },
): ShadowManualConversationState[] {
  const conv = session.conversation ?? []
  const turnMap = session.shadowTurnsByDoctorIndex
  const fallbackThoughts = formatSessionDoctorThoughts(session.doctorThoughts)
  const fallbackDiagnosis = (session.differentialDiagnosis ?? []) as DifferentialDiagnosisItem[]

  const states: ShadowManualConversationState[] = []
  if (!opts?.skipEmptyInitialState) {
    states.push({
      messages: [],
      thoughts: [],
      diagnosis: fallbackDiagnosis,
      timestamp: conv[0]?.timestamp ?? new Date().toISOString(),
    })
  }

  for (let i = 0; i < conv.length; i++) {
    const { thoughts, diagnosis } = buildShadowTurnSnapshotUpToIndex(
      conv,
      i,
      turnMap,
      fallbackThoughts,
      fallbackDiagnosis,
    )
    states.push({
      messages: conv.slice(0, i + 1),
      thoughts,
      diagnosis,
      timestamp: conv[i]?.timestamp ?? new Date().toISOString(),
    })
  }

  return states
}

export type ShadowSessionPhase = "initial" | "follow-up"

export type ShadowInitialSessionSnapshot = NonNullable<
  LearningSession["shadowInitialSnapshot"]
>

export type ShadowProgressPayload = {
  caseId?: string
  disease?: string
  conversationLength?: number
  isComplete?: boolean
  diagnosisReady?: boolean
  sessionPhase?: ShadowSessionPhase
  initialMessageCount?: number
  initialSessionSnapshot?: ShadowInitialSessionSnapshot
  soapNote?: string
  prescription?: string
  updatedAt?: string
}

/** Accept `follow-up`, `follow_up`, `followup`, etc. */
export function normalizeShadowSessionPhase(
  raw: unknown,
): ShadowSessionPhase | undefined {
  const p = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
  if (p === "follow-up" || p === "followup") return "follow-up"
  if (p === "initial") return "initial"
  return undefined
}

export type FollowUpSplitHints = {
  sessionPhase?: string
  initialMessageCount?: number
  initialSessionSnapshot?: ShadowInitialSessionSnapshot
}

/**
 * When the DB stores one transcript for both visits, return follow-up-only rows.
 * Prefers the follow-up greeting marker, then `initialMessageCount`, then snapshot length.
 */
export function splitFollowUpMessagesFromAll(
  allMessages: LearningConversationMessage[],
  hints: FollowUpSplitHints,
): LearningConversationMessage[] {
  const phase =
    normalizeShadowSessionPhase(hints.sessionPhase) ??
    (hints.initialSessionSnapshot &&
    typeof hints.initialMessageCount === "number" &&
    hints.initialMessageCount > 0
      ? "follow-up"
      : undefined)
  if (phase !== "follow-up") return dedupeShadowConversationMessages(allMessages)

  const greetingIdx = allMessages.findIndex((m) => {
    const id = String(m.id ?? "")
    const tagged = (m as LearningConversationMessage & { isFollowUp?: boolean })
      .isFollowUp
    return id.startsWith("follow-up-greeting") || tagged === true
  })
  if (greetingIdx >= 0) {
    return dedupeShadowConversationMessages(allMessages.slice(greetingIdx))
  }

  const metaCount =
    typeof hints.initialMessageCount === "number" && hints.initialMessageCount > 0
      ? Math.floor(hints.initialMessageCount)
      : undefined
  if (metaCount != null && allMessages.length > metaCount) {
    return dedupeShadowConversationMessages(allMessages.slice(metaCount))
  }

  const snapConv = hints.initialSessionSnapshot?.conversation
  const snapLen = Array.isArray(snapConv) ? snapConv.length : 0
  if (snapLen > 0 && allMessages.length > snapLen) {
    return dedupeShadowConversationMessages(allMessages.slice(snapLen))
  }

  return dedupeShadowConversationMessages(allMessages)
}

export function parseShadowProgressFromMetadata(
  convMetadata: unknown,
): ShadowProgressPayload | null {
  const meta =
    convMetadata && typeof convMetadata === "object" && !Array.isArray(convMetadata)
      ? (convMetadata as Record<string, unknown>)
      : {}
  const shadowProgress = meta.shadowProgress
  if (
    !shadowProgress ||
    typeof shadowProgress !== "object" ||
    Array.isArray(shadowProgress)
  ) {
    return null
  }
  const sp = shadowProgress as Record<string, unknown>
  const sessionPhase = normalizeShadowSessionPhase(sp.sessionPhase)
  const initialMessageCount =
    typeof sp.initialMessageCount === "number" && Number.isFinite(sp.initialMessageCount)
      ? Math.max(0, Math.floor(sp.initialMessageCount))
      : undefined
  const snap = sp.initialSessionSnapshot
  const initialSessionSnapshot =
    snap && typeof snap === "object" && !Array.isArray(snap)
      ? (snap as ShadowInitialSessionSnapshot)
      : undefined

  return {
    caseId: sp.caseId != null ? String(sp.caseId) : undefined,
    disease: sp.disease != null ? String(sp.disease) : undefined,
    conversationLength:
      typeof sp.conversationLength === "number" ? sp.conversationLength : undefined,
    isComplete: sp.isComplete === true,
    diagnosisReady: sp.diagnosisReady === true,
    sessionPhase,
    initialMessageCount,
    initialSessionSnapshot,
    soapNote: typeof sp.soapNote === "string" ? sp.soapNote : undefined,
    prescription: typeof sp.prescription === "string" ? sp.prescription : undefined,
    updatedAt: typeof sp.updatedAt === "string" ? sp.updatedAt : undefined,
  }
}

export function buildShadowProgressPayload(
  session: LearningSession,
  extras?: Partial<ShadowProgressPayload>,
): ShadowProgressPayload {
  return {
    caseId: session.caseId,
    disease: session.disease,
    conversationLength: session.conversation?.length ?? 0,
    isComplete: Boolean(session.isComplete),
    diagnosisReady: Boolean(session.diagnosisReady),
    sessionPhase: session.shadowPhase ?? extras?.sessionPhase ?? "initial",
    initialMessageCount:
      session.shadowInitialMessageCount ?? extras?.initialMessageCount,
    initialSessionSnapshot:
      session.shadowInitialSnapshot ?? extras?.initialSessionSnapshot,
    soapNote: session.shadowSoapNote ?? extras?.soapNote,
    prescription: session.shadowPrescription ?? extras?.prescription,
    updatedAt: new Date().toISOString(),
    ...extras,
  }
}

/** Split DB transcript + apply shadow fields when resuming a follow-up visit. */
export function applyFollowUpConversationResume(
  session: LearningSession,
  allMessages: LearningConversationMessage[],
  convMetadata: unknown,
): LearningConversationMessage[] {
  const sp = parseShadowProgressFromMetadata(convMetadata)
  const phase =
    sp?.sessionPhase ??
    normalizeShadowSessionPhase(session.shadowPhase) ??
    (sp?.initialSessionSnapshot && sp.initialMessageCount != null
      ? "follow-up"
      : undefined)

  if (phase !== "follow-up") {
    return allMessages
  }

  session.shadowPhase = "follow-up"
  session.shadowInitialMessageCount =
    sp?.initialMessageCount ?? session.shadowInitialMessageCount
  session.shadowInitialSnapshot =
    sp?.initialSessionSnapshot ?? session.shadowInitialSnapshot
  session.shadowSoapNote = sp?.soapNote ?? session.shadowSoapNote
  session.shadowPrescription = sp?.prescription ?? session.shadowPrescription
  session.diagnosisReady = sp?.diagnosisReady === true

  const followUpMessages = splitFollowUpMessagesFromAll(allMessages, {
    sessionPhase: "follow-up",
    initialMessageCount:
      session.shadowInitialMessageCount ?? sp?.initialMessageCount,
    initialSessionSnapshot:
      session.shadowInitialSnapshot ?? sp?.initialSessionSnapshot,
  })

  session.conversation = followUpMessages
  session.lastSyncedMessageCount = session.conversation.length
  return session.conversation
}

export function mergeShadowSessionFields(
  incoming: LearningSession,
  prev?: LearningSession | null,
): LearningSession {
  const supervisorInterventions = unionSupervisorInterventions(
    prev?.supervisorInterventions,
    incoming.supervisorInterventions,
  )
  const conversation = dedupeShadowConversationMessages(
    incoming.conversation ?? [],
  )
  return {
    ...incoming,
    conversation,
    shadowPhase: incoming.shadowPhase ?? prev?.shadowPhase,
    shadowInitialMessageCount:
      incoming.shadowInitialMessageCount ?? prev?.shadowInitialMessageCount,
    shadowInitialSnapshot:
      incoming.shadowInitialSnapshot ?? prev?.shadowInitialSnapshot,
    shadowSoapNote: incoming.shadowSoapNote ?? prev?.shadowSoapNote,
    shadowPrescription: incoming.shadowPrescription ?? prev?.shadowPrescription,
    ...(supervisorInterventions.length ? { supervisorInterventions } : {}),
  }
}

function clampDifferentialDiagnosisRaw(
  arr: unknown[],
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  if (!Array.isArray(arr)) return out
  for (let i = 0; i < arr.length && out.length < MAX_SHADOW_DD_ITEMS; i++) {
    const item = arr[i]
    if (!item || typeof item !== "object" || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    const condition = typeof o.condition === "string" ? o.condition.slice(0, 500) : ""
    if (!condition.trim()) continue
    const record: Record<string, unknown> = { condition }
    if (typeof o.probability === "number" && Number.isFinite(o.probability)) {
      record.probability = o.probability
    }
    if (typeof o.reason === "string") record.reason = o.reason.slice(0, 2000)
    if (typeof o.category === "string") record.category = o.category
    if (typeof o.timestamp === "string") record.timestamp = o.timestamp
    if (typeof o.createdAt === "string") record.createdAt = o.createdAt
    if (typeof o.apiTime === "number" && Number.isFinite(o.apiTime)) record.apiTime = o.apiTime
    out.push(record)
  }
  return out
}

function recordsToDdItems(records: Array<Record<string, unknown>>): DifferentialDiagnosisItem[] {
  return records.map((r) => {
    const cat = String(r.category ?? "secondary").toLowerCase()
    const allowed: DifferentialDiagnosisItem["category"][] = [
      "primary",
      "secondary",
      "rare",
      "rule-out",
      "loading",
    ]
    const category = (allowed.includes(cat as DifferentialDiagnosisItem["category"])
      ? cat
      : "secondary") as DifferentialDiagnosisItem["category"]
    return {
      condition: String(r.condition ?? ""),
      probability: typeof r.probability === "number" ? r.probability : 0,
      reason: typeof r.reason === "string" ? r.reason : "",
      category,
      ...(typeof r.apiTime === "number" ? { apiTime: r.apiTime } : {}),
      ...(typeof r.timestamp === "string" ? { timestamp: r.timestamp } : {}),
      ...(typeof r.createdAt === "string" ? { createdAt: r.createdAt } : {}),
    }
  })
}

function parseShadowTurnFromMetadata(
  raw: unknown,
): LearningConversationMessage["shadowTurn"] | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const doctorThought =
    typeof o.doctorThought === "string" && o.doctorThought.trim()
      ? o.doctorThought
      : undefined
  let differentialDiagnosis: Array<Record<string, unknown>> | undefined
  if (Array.isArray(o.differentialDiagnosis)) {
    const clamped = clampDifferentialDiagnosisRaw(o.differentialDiagnosis)
    if (clamped.length) differentialDiagnosis = clamped
  }
  if (!doctorThought && !differentialDiagnosis?.length) return undefined
  return {
    ...(doctorThought ? { doctorThought } : {}),
    ...(differentialDiagnosis ? { differentialDiagnosis } : {}),
  }
}

function extractDoctorThoughtContent(session: LearningSession, doctorIndex: number): string {
  const arr = session.doctorThoughts
  if (!Array.isArray(arr) || doctorIndex < 0 || doctorIndex >= arr.length) return ""
  const raw = arr[doctorIndex]
  if (!raw || typeof raw !== "object") return ""
  if ("content" in raw && typeof (raw as { content?: unknown }).content === "string") {
    return String((raw as { content: string }).content)
  }
  if ("thought" in raw && typeof (raw as { thought?: unknown }).thought === "string") {
    return String((raw as { thought: string }).thought)
  }
  return ""
}

function countDoctorMessagesBefore(
  messages: LearningConversationMessage[],
  index: number,
): number {
  let c = 0
  for (let j = 0; j < index; j++) {
    if (String(messages[j]?.role ?? "").toLowerCase() === "doctor") c++
  }
  return c
}

/**
 * Snapshot of doctor thought + DD keyed by doctor-turn index (0-based among doctor messages).
 * Stored on `medprep_conversations.metadata` so thought/DD updates sync without new chat rows.
 */
export function buildShadowTurnsByDoctorIndex(
  session: LearningSession,
): Record<string, { doctorThought?: string; differentialDiagnosis?: Array<Record<string, unknown>> }> {
  const msgs = session.conversation ?? []
  const dd = clampDifferentialDiagnosisRaw((session.differentialDiagnosis ?? []) as unknown[])
  const out: Record<
    string,
    { doctorThought?: string; differentialDiagnosis?: Array<Record<string, unknown>> }
  > = {}
  let d = 0
  for (let i = 0; i < msgs.length; i++) {
    if (String(msgs[i].role ?? "").toLowerCase() !== "doctor") continue
    const thought = extractDoctorThoughtContent(session, d)
    const entry: {
      doctorThought?: string
      differentialDiagnosis?: Array<Record<string, unknown>>
    } = {}
    if (thought) entry.doctorThought = thought.slice(0, MAX_SHADOW_THOUGHT_CHARS)
    if (dd.length) entry.differentialDiagnosis = dd
    if (Object.keys(entry).length) out[String(d)] = entry
    d++
  }
  if (d === 0 && dd.length) out["0"] = { differentialDiagnosis: dd }
  return out
}

/**
 * After loading transcript + conversation `metadata`, rebuild `doctorThoughts` and
 * `differentialDiagnosis` for the Shadow UI.
 */
export function hydrateShadowSessionFromMedprepMetadata(
  session: LearningSession,
  conversation: LearningConversationMessage[],
  convMetadata: unknown,
): void {
  const meta =
    convMetadata && typeof convMetadata === "object" && !Array.isArray(convMetadata)
      ? (convMetadata as Record<string, unknown>)
      : {}

  // Always restore supervisor flags first — doctor-turn hydration can return early below.
  let interventions = parseShadowSupervisorInterventionsFromMetadata(convMetadata)
  for (const msg of conversation) {
    if (String(msg.role ?? "").toLowerCase() !== "student") continue
    const embedded = (msg as LearningConversationMessage & {
      supervisorIntervention?: ShadowSupervisorIntervention
    }).supervisorIntervention
    if (embedded) {
      interventions = unionSupervisorInterventions(interventions, embedded)
    }
  }
  if (interventions.length) {
    session.supervisorInterventions = interventions
  }

  const sp = parseShadowProgressFromMetadata(convMetadata)
  const hydratedPhase =
    sp?.sessionPhase ??
    (sp?.initialSessionSnapshot && sp.initialMessageCount != null
      ? "follow-up"
      : undefined)
  if (hydratedPhase === "follow-up") {
    session.shadowPhase = "follow-up"
    session.shadowInitialMessageCount = sp.initialMessageCount
    session.shadowInitialSnapshot = sp.initialSessionSnapshot
    session.shadowSoapNote = sp.soapNote
    session.shadowPrescription = sp.prescription
    if (sp.diagnosisReady === true) {
      session.diagnosisReady = true
    }
  } else if (sp) {
    if (sp.diagnosisReady === true) {
      session.diagnosisReady = true
    } else if (sp.isComplete === true && session.isComplete !== true) {
      session.diagnosisReady = true
    }
  }

  type TurnEntry = { doctorThought?: string; differentialDiagnosis?: unknown[] }
  const fromMap = meta.shadowTurnsByDoctorIndex
  if (fromMap && typeof fromMap === "object" && !Array.isArray(fromMap)) {
    const keys = Object.keys(fromMap as object)
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b)
    if (keys.length > 0) {
      const thoughts: NonNullable<LearningSession["doctorThoughts"]> = []
      let lastDd: Array<Record<string, unknown>> = []
      for (const k of keys) {
        const turn = (fromMap as Record<string, unknown>)[String(k)]
        if (!turn || typeof turn !== "object" || Array.isArray(turn)) continue
        const t = turn as TurnEntry
        const thought =
          typeof t.doctorThought === "string" && t.doctorThought.trim()
            ? t.doctorThought
            : undefined
        if (thought) {
          thoughts.push({
            id: `shadow-restore-${k}-${session.id}`,
            content: thought,
            timestamp: new Date().toISOString(),
            context: "Restored",
          })
        }
        if (Array.isArray(t.differentialDiagnosis) && t.differentialDiagnosis.length) {
          lastDd = clampDifferentialDiagnosisRaw(t.differentialDiagnosis)
        }
      }
      if (thoughts.length) session.doctorThoughts = thoughts
      if (lastDd.length) session.differentialDiagnosis = recordsToDdItems(lastDd)
      session.shadowTurnsByDoctorIndex = fromMap as Record<string, ShadowTurnEntry>
      if (thoughts.length || lastDd.length) return
    }
  }

  const thoughts: NonNullable<LearningSession["doctorThoughts"]> = []
  let lastDd: Array<Record<string, unknown>> = []
  for (const msg of conversation) {
    if (String(msg.role ?? "").toLowerCase() !== "doctor") continue
    const st = msg.shadowTurn
    const thought = st?.doctorThought?.trim()
    if (thought) {
      thoughts.push({
        id: `shadow-msg-restore-${thoughts.length}-${session.id}`,
        content: thought,
        timestamp: msg.timestamp,
        context: "Restored",
      })
    }
    if (st?.differentialDiagnosis?.length) {
      lastDd = clampDifferentialDiagnosisRaw(st.differentialDiagnosis as unknown[])
    }
  }
  if (thoughts.length) session.doctorThoughts = thoughts
  if (lastDd.length) session.differentialDiagnosis = recordsToDdItems(lastDd)

  const turnMapFromMsgs: Record<string, ShadowTurnEntry> = {}
  let doctorIdx = 0
  for (const msg of conversation) {
    if (String(msg.role ?? "").toLowerCase() !== "doctor") continue
    const st = msg.shadowTurn
    if (st?.doctorThought || st?.differentialDiagnosis?.length) {
      turnMapFromMsgs[String(doctorIdx)] = {
        ...(st.doctorThought ? { doctorThought: st.doctorThought } : {}),
        ...(st.differentialDiagnosis?.length
          ? { differentialDiagnosis: st.differentialDiagnosis }
          : {}),
      }
    }
    doctorIdx++
  }
  if (Object.keys(turnMapFromMsgs).length) {
    session.shadowTurnsByDoctorIndex = {
      ...(session.shadowTurnsByDoctorIndex ?? {}),
      ...turnMapFromMsgs,
    }
  }
}

/** Drop adjacent duplicate API rows (double-save / double-submit). */
function collapseAdjacentDuplicateMessages(messages: unknown[]): unknown[] {
  if (!Array.isArray(messages) || messages.length === 0) return messages
  const out: unknown[] = [messages[0]]
  for (let i = 1; i < messages.length; i++) {
    const cur = messages[i] as Record<string, unknown>
    const prev = out[out.length - 1] as Record<string, unknown>
    const prevRole = String(prev?.role ?? "").toUpperCase()
    const curRole = String(cur?.role ?? "").toUpperCase()
    const sameRole = prevRole === curRole
    const sameContent =
      String(prev?.content ?? "").trim() === String(cur?.content ?? "").trim()
    if (sameRole && sameContent) continue
    out.push(cur)
  }
  return out
}

/** Maps MedPrep `messages` from GET session → shadow `LearningSession.conversation` (doctor/patient/student). */
export function mapMedprepApiMessagesToShadowConversation(
  rawMessages: unknown[],
): LearningConversationMessage[] {
  const messages = collapseAdjacentDuplicateMessages(
    Array.isArray(rawMessages) ? rawMessages : [],
  )
  const mapped = messages.map((msg: unknown, idx: number) => {
    const m = msg as Record<string, unknown>
    const roleLower = String(m.role ?? "")
      .toLowerCase()
      .trim()
    const role: LearningConversationMessage["role"] =
      roleLower === "patient"
        ? "patient"
        : roleLower === "student"
          ? "student"
          : "doctor"
    const meta =
      m.metadata && typeof m.metadata === "object" && !Array.isArray(m.metadata)
        ? (m.metadata as Record<string, unknown>)
        : undefined
    const shadowTurn =
      meta?.shadowTurn != null ? parseShadowTurnFromMetadata(meta.shadowTurn) : undefined
    const dbId = typeof m.id === "string" && m.id ? m.id : undefined
    const supervisorFromMeta =
      meta?.supervisorIntervention != null
        ? parseSupervisorInterventionFromMessageMetadata(meta.supervisorIntervention, {
            question: String(m.content ?? ""),
            messageId: dbId,
          })
        : undefined
    return {
      id: dbId ?? `m-${idx}-${String(m.createdAt ?? "")}`,
      ...(dbId ? { medprepMessageId: dbId } : {}),
      role,
      content: String(m.content ?? ""),
      ...(meta?.explanation != null
        ? { explanation: String(meta.explanation) }
        : {}),
      ...(shadowTurn ? { shadowTurn } : {}),
      ...(supervisorFromMeta ? { supervisorIntervention: supervisorFromMeta } : {}),
      timestamp:
        typeof m.createdAt === "string"
          ? m.createdAt
          : m.createdAt instanceof Date
            ? m.createdAt.toISOString()
            : new Date().toISOString(),
    }
  })
  return dedupeShadowConversationMessages(mapped)
}

/**
 * Appends new shadow chat rows to `medprep_conversation_messages` (same contract as Learning mode).
 * Mutates `session.lastSyncedMessageCount` on success so refresh/resume stays aligned with the DB.
 */
export async function appendShadowMedprepConversationMessages(opts: {
  userId: string
  conversationId: string
  session: LearningSession
}): Promise<void> {
  const { userId, conversationId, session } = opts
  const msgs = session.conversation ?? []
  const n = msgs.length
  let already = Math.max(0, session.lastSyncedMessageCount ?? 0)
  if (already > n) {
    session.lastSyncedMessageCount = n
    already = n
  }
  let syncedThrough = already
  for (let i = already; i < n; i++) {
    const message = msgs[i]
    const prevMsg = i > 0 ? msgs[i - 1] : undefined
    if (
      prevMsg &&
      String(prevMsg.role ?? "").toLowerCase() === String(message.role ?? "").toLowerCase() &&
      String(prevMsg.content ?? "").trim() === String(message.content ?? "").trim()
    ) {
      syncedThrough = i + 1
      continue
    }
    const r = String(message.role || "").toLowerCase()
    const role = r === "patient" ? "PATIENT" : r === "student" ? "STUDENT" : "DOCTOR"
    const body: Record<string, unknown> = {
      role,
      content: String(message.content ?? ""),
      isIntervention: false,
    }
    const meta: Record<string, unknown> = {}
    if (message.explanation) meta.explanation = message.explanation
    if (role === "DOCTOR") {
      const doctorIdx = countDoctorMessagesBefore(msgs, i)
      const thought = extractDoctorThoughtContent(session, doctorIdx)
      const dd = clampDifferentialDiagnosisRaw((session.differentialDiagnosis ?? []) as unknown[])
      const shadowTurn: Record<string, unknown> = {}
      if (thought) shadowTurn.doctorThought = thought.slice(0, MAX_SHADOW_THOUGHT_CHARS)
      if (dd.length) shadowTurn.differentialDiagnosis = dd
      if (Object.keys(shadowTurn).length) meta.shadowTurn = shadowTurn
    }
    if (role === "STUDENT") {
      const iv = findSupervisorInterventionForStudentMessage(session, message)
      if (iv) {
        Object.assign(meta, supervisorInterventionToMessageMetadata(iv))
        body.isIntervention = true
      }
    }
    if (Object.keys(meta).length) body.metadata = meta
    const msgFetch = await safeClientFetch(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages?userId=${encodeURIComponent(userId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        timeoutMs: 35_000,
      },
    )
    if (!msgFetch.ok) break
    const msgRes = msgFetch.response
    if (!msgRes.ok) {
      const errText = await msgRes.text().catch(() => "")
      if (process.env.NODE_ENV === "development") {
        console.warn("[Shadow] MedPrep message append failed:", msgRes.status, errText.slice(0, 240))
      }
      break
    }
    const payload = (await msgRes.json().catch(() => null)) as {
      message?: { id?: string }
    } | null
    const dbId = payload?.message?.id
    if (dbId) message.medprepMessageId = dbId
    syncedThrough = i + 1
  }
  session.lastSyncedMessageCount = syncedThrough
}

/** Per-conversation message ids already PATCHed with supervisor metadata (avoids duplicate writes). */
const supervisorMessagePatchDone = new Map<string, Set<string>>()

/** Writes supervisor flags onto synced STUDENT rows (visible in Prisma on messages). */
export async function syncSupervisorInterventionsToMedprepMessages(opts: {
  conversationId: string
  userId: string
  session: LearningSession
}): Promise<void> {
  const { conversationId, userId, session } = opts
  const interventions = clampSupervisorInterventions(session.supervisorInterventions)
  if (!interventions.length) return

  const patched = supervisorMessagePatchDone.get(conversationId) ?? new Set<string>()
  const msgs = session.conversation ?? []
  for (const iv of interventions) {
    const local = msgs.find(
      (m) =>
        String(m.role ?? "").toLowerCase() === "student" &&
        ((iv.messageId && m.id === iv.messageId) ||
          String(m.content ?? "").trim() === String(iv.question ?? "").trim()),
    )
    const dbId = local?.medprepMessageId
    if (!dbId || patched.has(dbId)) continue

    const patchFetch = await safeClientFetch(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(dbId)}?userId=${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isIntervention: true,
          metadata: supervisorInterventionToMessageMetadata(iv),
        }),
        timeoutMs: 20_000,
      },
    )
    if (patchFetch.ok && patchFetch.response.ok) {
      patched.add(dbId)
    }
  }
  if (patched.size) supervisorMessagePatchDone.set(conversationId, patched)
}

/**
 * Keeps Prisma `medprep_conversations` in sync for Shadow Mode:
 * - ACTIVE + merged `metadata.shadowProgress` while the learner is in progress (discontinued mid-case still resumes).
 * - COMPLETED when `session.isComplete` is true (drops off resume lists).
 */
export async function patchShadowMedprepConversationProgress(opts: {
  conversationId: string
  userId: string
  session: LearningSession
  shadowProgressExtras?: Partial<ShadowProgressPayload>
}): Promise<void> {
  const { conversationId, userId, session, shadowProgressExtras } = opts
  const titleRaw = session.disease || session.caseId
  const title = titleRaw ? String(titleRaw).slice(0, 255) : undefined
  const turnMap = buildShadowTurnsByDoctorIndex(session)
  const supervisorInterventions = clampSupervisorInterventions(
    session.supervisorInterventions ?? [],
  )
  const shadowProgress = buildShadowProgressPayload(session, shadowProgressExtras)
  const patchFetch = await safeClientFetch(
    `/api/conversations/${encodeURIComponent(conversationId)}?userId=${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        status: session.isComplete ? "COMPLETED" : "ACTIVE",
        ...(title ? { title } : {}),
        metadata: {
          shadowProgress,
          shadowTurnsByDoctorIndex: turnMap,
          ...(supervisorInterventions.length > 0
            ? { shadowSupervisorInterventions: supervisorInterventions }
            : {}),
        },
      }),
      timeoutMs: 35_000,
    },
  )

  if (!patchFetch.ok) return

  const res = patchFetch.response
  if (!res.ok) {
    const err = await res.text().catch(() => "")
    if (process.env.NODE_ENV === "development") {
      console.warn("[Shadow] MedPrep session sync failed:", res.status, err)
    }
    return
  }

  await syncSupervisorInterventionsToMedprepMessages({
    conversationId,
    userId,
    session,
  })
}
