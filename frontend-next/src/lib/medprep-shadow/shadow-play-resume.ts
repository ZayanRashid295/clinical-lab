import type { MedicalCase } from "@/lib/fyp/data-models"
import type { LearningSession } from "@/lib/medprep-shadow/learning-types"
import {
  applyFollowUpConversationResume,
  hydrateShadowSessionFromMedprepMetadata,
  mapMedprepApiMessagesToShadowConversation,
  mergeShadowSessionFields,
  parseShadowProgressFromMetadata,
} from "@/lib/medprep-shadow/shadow-medprep-db-sync"
import { useShadowModeStore } from "@/lib/medprep-shadow/shadowModeStore"
import type { InitialSessionData } from "@/lib/medprep-shadow/shadowModeStore"

type ConversationPayload = {
  caseId?: string | null
  mode?: string
  status?: string
  messages?: unknown[]
  metadata?: unknown
}

export function applyShadowZustandPhaseFromMetadata(convMetadata: unknown): void {
  const sp = parseShadowProgressFromMetadata(convMetadata)
  if (sp?.sessionPhase !== "follow-up" || !sp.initialSessionSnapshot) return

  const snapshot = sp.initialSessionSnapshot as InitialSessionData
  const seededReports = (snapshot.reports || []) as InitialSessionData["reports"]

  useShadowModeStore.setState((state) => ({
    sessionPhase: "follow-up",
    initialSessionData: snapshot,
    reportCache: Array.isArray(state.reportCache)
      ? [...state.reportCache, ...seededReports]
      : [...seededReports],
  }))
}

/**
 * When `/medprep-ai/shadow-play` has `conversationId` + `caseId`, load that SHADOW row and build UI state.
 * Restores follow-up phase, initial-session snapshot, and follow-up-only transcript from metadata.
 */
export async function tryResumeShadowPlayFromUrl(opts: {
  userId: string
  caseId: string
  resumeConversationId: string
  resolveMedicalCase: (caseId: string) => Promise<MedicalCase>
}): Promise<{ medicalCase: MedicalCase; session: LearningSession } | null> {
  const { userId, caseId, resumeConversationId, resolveMedicalCase } = opts
  try {
    const res = await fetch(
      `/api/conversations/${encodeURIComponent(resumeConversationId)}?userId=${encodeURIComponent(userId)}`,
    )
    const data = (await res.json().catch(() => null)) as {
      success?: boolean
      conversation?: ConversationPayload & { id?: string; startedAt?: string }
    } | null
    const conv = data?.conversation
    const convCaseId = conv?.caseId != null ? String(conv.caseId) : ""
    const modeOk = String(conv?.mode ?? "").toUpperCase() === "SHADOW"
    if (!res.ok || !conv || !modeOk || convCaseId !== String(caseId)) return null

    const medicalCase = await resolveMedicalCase(caseId)
    const completed = String(conv?.status ?? "").toUpperCase() === "COMPLETED"
    const allMessages = mapMedprepApiMessagesToShadowConversation(
      Array.isArray(conv.messages) ? conv.messages : [],
    )

    const session: LearningSession = {
      id: `session-${Date.now()}`,
      caseId: String(caseId),
      disease: medicalCase.disease,
      patientProfile: medicalCase.patientProfile,
      conversation: allMessages,
      isComplete: completed,
      conversationId: resumeConversationId,
      lastSyncedMessageCount: allMessages.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    hydrateShadowSessionFromMedprepMetadata(session, allMessages, conv?.metadata)
    applyFollowUpConversationResume(session, allMessages, conv?.metadata)
    applyShadowZustandPhaseFromMetadata(conv?.metadata)

    return { medicalCase, session: mergeShadowSessionFields(session, null) }
  } catch {
    return null
  }
}
