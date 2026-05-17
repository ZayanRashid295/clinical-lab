import type { MedicalCase, ChatMessage as DataChatMessage } from "@/lib/fyp/data-models"
import type {
  LearningSession as BaseLearningSession,
  LearningConversationMessage,
} from "@/lib/fyp/learning-service"
import type { DifferentialDiagnosisItem } from "@/lib/medprep-shadow/services/differential-diagnosis.service"
import type { ShadowSupervisorIntervention } from "@/lib/medprep-shadow/shadow-medprep-db-sync"

/** Shadow UI chat rows (extends FYP chat with optional teaching fields). */
export type ChatMessage = DataChatMessage

export type LearningSession = BaseLearningSession & {
  updatedAt?: string
  doctorThoughts?: Array<
    | { time: string; thought: string }
    | { id: string; content: string; timestamp: string; context: string; apiTime?: number }
  >
  differentialDiagnosis?: DifferentialDiagnosisItem[]
  /** Persisted on `medprep_conversations.metadata.shadowTurnsByDoctorIndex` for Back/Next. */
  shadowTurnsByDoctorIndex?: Record<
    string,
    {
      doctorThought?: string
      differentialDiagnosis?: Array<Record<string, unknown>>
    }
  >
  /** AI supervisor flags; persisted on `medprep_conversations.metadata.shadowSupervisorInterventions`. */
  supervisorInterventions?: ShadowSupervisorIntervention[]
  /**
   * Interview gathered enough information; show Conclude Consultation.
   * Persisted in `metadata.shadowProgress.diagnosisReady`.
   */
  diagnosisReady?: boolean
  /** Persisted in `metadata.shadowProgress` for resume across refresh. */
  shadowPhase?: "initial" | "follow-up"
  /** DB message count at end of initial visit (follow-up rows are appended after this). */
  shadowInitialMessageCount?: number
  /** Frozen initial consultation for "View Initial Session". */
  shadowInitialSnapshot?: {
    conversation: LearningConversationMessage[]
    soapNote?: string
    prescription?: string
    reports?: unknown[]
    differentialDiagnosis?: unknown[]
    doctorThoughts?: unknown[]
    timestamp?: string
  }
  shadowSoapNote?: string
  shadowPrescription?: string
}

export type { MedicalCase, LearningConversationMessage }

export interface LearningInterfaceProps {
  session: LearningSession
  onSessionUpdate: (session: LearningSession) => void
  medicalCase: MedicalCase
  isFullScreen?: boolean
}
