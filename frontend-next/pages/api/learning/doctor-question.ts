import type { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import type { ConversationContext } from "@/lib/fyp/data-models"
import { learningService, type LearningConversationMessage } from "@/lib/fyp/learning-service"
import { parseNextJsonBody } from "@/lib/api/parse-json-body"

function hydrateGeminiApiKeyFromBackendEnv() {
  if (
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY
  ) {
    return
  }
  const backendEnvPath = path.resolve(process.cwd(), "../backend/.env")
  if (!fs.existsSync(backendEnvPath)) return
  const backendEnv = fs.readFileSync(backendEnvPath, "utf8")
  const geminiKeyMatch = backendEnv.match(/^(?:GOOGLE_API_KEY|GEMINI_API_KEY)\s*=\s*("?)(.*?)\1\s*$/m)
  if (!geminiKeyMatch?.[2]) return
  process.env.GOOGLE_API_KEY = geminiKeyMatch[2]
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x)
}

function coerceAge(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n)) return n
  }
  return 0
}

/** Shadow / enhanced UI: `{ currentCase, patientInfo?, conversation? }` */
function buildContextFromLegacyCasePayload(data: Record<string, unknown>): ConversationContext | null {
  const rawCase = data.currentCase
  if (!isRecord(rawCase)) return null

  const legacyPatient = isRecord(data.patientInfo) ? data.patientInfo : null
  const casePatient = isRecord(rawCase.patientProfile) ? (rawCase.patientProfile as Record<string, unknown>) : null
  const src = legacyPatient ?? casePatient ?? {}

  const symptoms = Array.isArray(rawCase.symptoms) ? (rawCase.symptoms as string[]) : []
  const disease = String(rawCase.disease ?? "Unknown condition")
  const caseId = String(rawCase.id ?? data.caseId ?? "case")

  return {
    caseId,
    disease,
    diseaseName: String(rawCase.diseaseName ?? disease),
    specialty: String(rawCase.specialty ?? "General Medicine"),
    isRare: Boolean(rawCase.isRare),
    symptoms,
    history: Array.isArray(rawCase.history) ? (rawCase.history as string[]) : [],
    labs: isRecord(rawCase.labs) ? (rawCase.labs as Record<string, unknown>) : {},
    patientProfile: {
      name: String(src.name ?? "Patient"),
      age: coerceAge(src.age),
      gender: String(src.gender ?? "Unknown"),
      occupation: String(src.occupation ?? "Not specified"),
    },
    conversationHistory: [],
  }
}

function normalizeContextFromBody(data: Record<string, unknown>): ConversationContext {
  const ctx = data.context
  if (isRecord(ctx) && isRecord(ctx.patientProfile)) {
    const pp = ctx.patientProfile as Record<string, unknown>
    const symptoms = Array.isArray(ctx.symptoms) ? (ctx.symptoms as string[]) : []
    return {
      caseId: String(ctx.caseId ?? "case"),
      disease: String(ctx.disease ?? ""),
      diseaseName: String(ctx.diseaseName ?? ctx.disease ?? ""),
      specialty: String(ctx.specialty ?? "General Medicine"),
      isRare: Boolean(ctx.isRare),
      symptoms,
      history: Array.isArray(ctx.history) ? (ctx.history as string[]) : [],
      labs: isRecord(ctx.labs) ? (ctx.labs as Record<string, unknown>) : {},
      patientProfile: {
        name: String(pp.name ?? "Patient"),
        age: coerceAge(pp.age),
        gender: String(pp.gender ?? "Unknown"),
        occupation: String(pp.occupation ?? "Unknown"),
      },
      conversationHistory: Array.isArray(ctx.conversationHistory)
        ? (ctx.conversationHistory as ConversationContext["conversationHistory"])
        : [],
    }
  }

  const fromCase = buildContextFromLegacyCasePayload(data)
  if (fromCase) return fromCase

  throw new Error("DOCTOR_QUESTION_INVALID_BODY")
}

function normalizeConversation(raw: unknown): LearningConversationMessage[] {
  if (!Array.isArray(raw)) return []
  const out: LearningConversationMessage[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const role = item.role
    if (role !== "doctor" && role !== "patient" && role !== "student") continue
    out.push({
      role,
      content: String(item.content ?? ""),
      timestamp: typeof item.timestamp === "string" ? item.timestamp : new Date().toISOString(),
      explanation: typeof item.explanation === "string" ? item.explanation : undefined,
      id: typeof item.id === "string" ? item.id : undefined,
    })
  }
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    hydrateGeminiApiKeyFromBackendEnv()
    const parsed = parseNextJsonBody(req.body)
    if (!parsed.ok) {
      return res.status(400).json({ error: "INVALID_JSON", message: parsed.error })
    }

    const context = normalizeContextFromBody(parsed.data)
    const conversation = normalizeConversation(parsed.data.conversation)
    const isConclusion = parsed.data.isConclusion === true
    const instruction =
      typeof parsed.data.instruction === "string" ? parsed.data.instruction : undefined

    const result = isConclusion
      ? await learningService.generateDoctorConclusion(
          context,
          conversation,
          instruction,
        )
      : await learningService.generateDoctorQuestion(context, conversation)

    return res.status(200).json({
      question: result.question,
      explanation: result.explanation,
      nextQuestion: result.question,
    })
  } catch (e) {
    console.error("doctor-question:", e)
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("DOCTOR_QUESTION_INVALID_BODY")) {
      return res.status(400).json({ error: "Invalid request body", message: msg })
    }
    if (msg.includes("Gemini API key")) {
      return res.status(503).json({ error: "AI configuration error", message: msg })
    }
    return res.status(500).json({
      error: "Failed to generate doctor question",
      message: process.env.NODE_ENV === "development" ? msg : undefined,
    })
  }
}
