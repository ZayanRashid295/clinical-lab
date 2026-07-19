import type { ConversationContext } from "./data-models"
import { saveSoapDraft } from "./medprep-persistence-service"
import { BEST_GEMINI_MODEL, GEMINI_TURN_MODEL, runNewGemini } from "./llm-gemini"
import {
  CLINICAL_PLAIN_TEXT_RULES,
  formatClinicalText,
} from "@/lib/medprep-shadow/shadow-ui/format-clinical-text"

async function generateText({
  model,
  system,
  prompt,
  jsonMode = false,
  maxOutputTokens,
}: {
  model?: string
  system?: string
  prompt: string
  /** When true, request application/json (use for structured JSON-only prompts). */
  jsonMode?: boolean
  maxOutputTokens?: number
}): Promise<{ text: string }> {
  const modelName = (model && model.trim()) || GEMINI_TURN_MODEL
  const text = await runNewGemini(
    modelName,
    system || "",
    prompt,
    false,
    0,
    !jsonMode,
    undefined,
    maxOutputTokens,
  )
  return { text }
}

export interface LearningConversationMessage {
  id?: string
  role: "doctor" | "patient" | "student"
  content: string
  explanation?: string
  timestamp: string
  /**
   * Shadow / MedPrep: stored in `medprep_conversation_messages.metadata.shadowTurn`
   * and rebuilt on resume so doctor thought + DD align with this chat row.
   */
  shadowTurn?: {
    doctorThought?: string
    differentialDiagnosis?: Array<Record<string, unknown>>
  }
  /** Prisma `medprep_conversation_messages.id` after sync. */
  medprepMessageId?: string
}

export interface LearningSOAPNote {
  subjective: string
  subjectiveExplanation: string
  objective: string
  objectiveExplanation: string
  assessment: string
  assessmentExplanation: string
  plan: string
  planExplanation: string
}

export interface LearningSession {
  /** Stable local key: `learn_${caseId}` (never replace with backend id). */
  id: string
  caseId: string
  disease: string
  studentId?: string
  /** Backend Medprep conversation id (cuid). */
  conversationId?: string
  /** Number of conversation messages already POSTed to the backend (idempotent sync). */
  lastSyncedMessageCount?: number
  patientProfile: {
    name: string
    age: number
    gender: string
    occupation: string
  }
  conversation: LearningConversationMessage[]
  soapNote?: LearningSOAPNote
  isComplete: boolean
  createdAt: string
  // Additional state to restore
  patientInfo?: {
    demographics: { maritalStatus: string; insurance: string }
    medicalHistory: string[]
    socialHistory: { smoking: string; alcohol: string; exercise: string }
    familyHistory: { mother: string; father: string }
  }
  vitalSigns?: {
    bloodPressure: string
    heartRate: number
    temperature: string
    respiratoryRate: number
  }
  uiState?: {
    activePatientInfoSection: string
    activeNurseReportSection: string
    activeTab: "conversation" | "soap"
    collapsedSections: {
      demographics: boolean
      medicalHistory: boolean
      socialHistory: boolean
      familyHistory: boolean
      chiefComplaint: boolean
      presentingSymptoms: boolean
      vitalSigns: boolean
      clinicalNotes: boolean
      initialAssessment: boolean
      learningGuidelines: boolean
      clinicalTips: boolean
      keyAreas: boolean
      redFlags: boolean
      sessionProgress: boolean
    }
  }
}

/** Persisted under MedprepConversation.metadata.learningState */
export interface LearningMetadataState {
  patientInfo?: LearningSession["patientInfo"]
  vitalSigns?: LearningSession["vitalSigns"]
  uiState?: LearningSession["uiState"]
  soapNote?: LearningSOAPNote
  isComplete?: boolean
}

const LEARN_PREFIX = "learn_"

function isLikelyCuid(id: string): boolean {
  return /^c[a-z0-9]{20,32}$/i.test(id)
}

/** Collapse adjacent duplicate message rows issued by concurrent client saves against the old API (same role/content/timestamp). */
function collapseLegacyDuplicateAdjacentMessages(messages: unknown[]): unknown[] {
  if (!Array.isArray(messages) || messages.length === 0) return messages
  const out: unknown[] = [messages[0]]
  for (let i = 1; i < messages.length; i++) {
    const cur = messages[i] as any
    const prev = out[out.length - 1] as any
    const sameRole = String(prev?.role ?? "") === String(cur?.role ?? "")
    const sameContent = String(prev?.content ?? "") === String(cur?.content ?? "")
    const t1 = new Date(prev?.createdAt).getTime()
    const t2 = new Date(cur?.createdAt).getTime()
    const sameInstant =
      Number.isFinite(t1) && Number.isFinite(t2) && t1 === t2
    if (sameRole && sameContent && sameInstant) continue
    out.push(cur)
  }
  return out
}

class LearningService {
  private readonly saveQueues = new Map<string, Promise<void>>()
  private readonly persistedMessageCounts = new Map<string, number>()
  /** Skips redundant session PATCH calls when queued saves replay the same snapshot. */
  private readonly lastSyncedMetadataFingerprintByConversation = new Map<string, string>()

  /** Returns undefined for anonymous / missing — DB sync is skipped in that case. */
  normalizeStudentId(userId?: string | null): string | undefined {
    const u = typeof userId === "string" ? userId.trim() : ""
    if (!u || u === "anonymous") return undefined
    return u
  }

  private checkAPIKey(): void {
    const apiKey =
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("Gemini API key is missing (GOOGLE_API_KEY or GEMINI_API_KEY).")
    }
  }

  async testAPIConnection(): Promise<boolean> {
    try {
      this.checkAPIKey()
      const { text } = await generateText({
        model: BEST_GEMINI_MODEL,
        prompt: "Say 'API connection successful'",
        maxOutputTokens: 64,
      })
      return text.includes("successful")
    } catch (error) {
      console.error("API Test Failed:", error)
      return false
    }
  }

  async generateDoctorQuestion(
    context: ConversationContext,
    conversationHistory: LearningConversationMessage[],
  ): Promise<{ question: string; explanation: string }> {
    this.checkAPIKey()

    const { symptoms, patientProfile } = context
    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        maxOutputTokens: 512,
        system: `You are an experienced doctor conducting a patient interview for educational purposes. You do NOT know the patient's diagnosis - you must investigate and deduce it through questioning.

Patient Profile:
- Name: ${patientProfile.name}
- Age: ${patientProfile.age}
- Gender: ${patientProfile.gender}
- Occupation: ${patientProfile.occupation}
- Known symptoms: ${symptoms.join(", ")}

IMPORTANT: You are investigating an unknown condition. Ask questions that help narrow down differential diagnoses and gather diagnostic information. Do not assume you know the diagnosis.

Your task is to ask the next logical question to gather information for diagnosis. After each question, provide an educational explanation for students about why you asked that specific question.
Keep the dialogue fast and focused:
- Ask exactly one concise question.
- Keep the question to one sentence (about 8-18 words).
- No preamble, no multi-question bundles, no long paragraphs.

Format your response as:
QUESTION: [Your question to the patient]
EXPLANATION: [1 short sentence explaining why this question matters]

Previous conversation:
${conversationContext}
${CLINICAL_PLAIN_TEXT_RULES}`,
        prompt: `Based on the conversation so far, what is the next most important question to ask this patient to help narrow down the differential diagnosis? Include your educational explanation.`,
      })

      const lines = text.split("\n")
      const questionLine = lines.find((line) => line.startsWith("QUESTION:"))
      const explanationLine = lines.find((line) => line.startsWith("EXPLANATION:"))

      const question = formatClinicalText(
        questionLine?.replace("QUESTION:", "").trim() || text.split("EXPLANATION:")[0].trim(),
      )
      const explanation = formatClinicalText(
        explanationLine?.replace("EXPLANATION:", "").trim() ||
          `This question helps gather key diagnostic information efficiently.`,
      )

      return { question, explanation }
    } catch (error) {
      console.error("Error generating doctor question:", error)
      return {
        question: "Can you tell me more about when your symptoms started?",
        explanation: "Understanding the timeline of symptoms is crucial for differential diagnosis.",
      }
    }
  }

  /** Closing statement when the case has gathered enough information (not a new question). */
  async generateDoctorConclusion(
    context: ConversationContext,
    conversationHistory: LearningConversationMessage[],
    instruction?: string,
  ): Promise<{ question: string; explanation: string }> {
    this.checkAPIKey()

    const { symptoms, patientProfile } = context
    const conversationContext = conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")

    const defaultInstruction =
      "You have gathered enough information. Deliver a brief, empathetic closing statement (2–3 sentences). Thank the patient, acknowledge what was discussed, and state that you will now formulate your assessment. Do NOT ask any new questions."

    try {
      const { text } = await generateText({
        maxOutputTokens: 512,
        system: `You are an experienced physician ending a simulated patient interview for medical education.

Patient: ${patientProfile.name}, ${patientProfile.age}y, ${patientProfile.gender}
Symptoms on file: ${symptoms.join(", ")}

Transcript:
${conversationContext || "(empty)"}

Output ONLY the doctor's closing statement to the patient. No QUESTION:/EXPLANATION: labels. No interview questions.
${CLINICAL_PLAIN_TEXT_RULES}`,
        prompt: instruction?.trim() || defaultInstruction,
      })

      const statement = formatClinicalText(
        text
          .replace(/^QUESTION:\s*/i, "")
          .replace(/^EXPLANATION:.*$/gim, "")
          .trim(),
      )

      return {
        question:
          statement ||
          "Thank you for sharing all of this with me. I have enough information to formulate my assessment now.",
        explanation: "",
      }
    } catch (error) {
      console.error("Error generating doctor conclusion:", error)
      return {
        question:
          "Thank you for providing this information. I have sufficient clinical data to conclude our consultation and formulate my assessment.",
        explanation: "",
      }
    }
  }

  async generatePatientResponse(doctorQuestion: string, context: ConversationContext): Promise<string> {
    this.checkAPIKey()

    const { disease, symptoms, patientProfile } = context

    try {
      const { text } = await generateText({
        maxOutputTokens: 384,
        system: `You are a patient with ${disease}. You are the TRUTH SOURCE - you know your exact condition and all associated symptoms, history, and lab results.

Your profile:
- Name: ${patientProfile.name}
- Age: ${patientProfile.age}
- Gender: ${patientProfile.gender}
- Occupation: ${patientProfile.occupation}
- Current symptoms: ${symptoms.join(", ")}

IMPORTANT PATIENT AGENT RULES:
1. You have FULL KNOWLEDGE of your disease: ${disease}
2. You know ALL your symptoms, medical history, and lab results
3. Answer CONSISTENTLY with your condition - never contradict yourself
4. If asked directly "what do you have?" → reply naturally (e.g., "I don't know, doctor, that's why I'm here")
5. Provide information that a patient with ${disease} would realistically know
6. Keep responses concise and conversational
7. Share relevant medical history when asked
8. If asked about something unrelated to your condition, gently redirect to your symptoms
9. NEVER reveal the exact diagnosis name unless specifically asked in a way a patient would know it
10. Answer in 1-2 short sentences, usually under 35 words total
11. Respond directly to the latest question first, then add one key detail
12. Do not output role labels, bullets, or long paragraphs

Respond to the doctor's questions naturally and realistically.
${CLINICAL_PLAIN_TEXT_RULES}`,
        prompt: `The doctor asks: "${doctorQuestion}"

Respond as the patient with ${disease}. Keep it short, clear, and natural.`,
      })

      return formatClinicalText(text)
    } catch (error) {
      console.error("Error generating patient response:", error)
      return "I'm not feeling well, doctor. Could you please be more specific about what you'd like to know?"
    }
  }

  async shouldEndConversation(
    conversationHistory: LearningConversationMessage[],
    disease: string,
  ): Promise<{ shouldEnd: boolean; reason: string }> {
    this.checkAPIKey()

    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        maxOutputTokens: 256,
        system: `You are an experienced doctor evaluating whether you have gathered enough information to diagnose ${disease}.

Review the conversation and determine if you have sufficient information for:
1. Patient's chief complaint and history of present illness
2. Relevant past medical history
3. Key symptoms and their characteristics
4. Any necessary review of systems

Respond with either:
- "CONTINUE: [reason to continue]" if more information is needed
- "END: [reason to end]" if sufficient information has been gathered`,
        prompt: `Review this conversation about a patient with ${disease}:

${conversationContext}

Do you have enough information to proceed with diagnosis and treatment planning?`,
      })

      const shouldEnd = text.startsWith("END:")
      const reason = text.replace(/^(CONTINUE:|END:)\s*/, "")

      return { shouldEnd, reason }
    } catch (error) {
      console.error("Error evaluating conversation completion:", error)
      // Default to continuing if there are fewer than 6 exchanges
      const doctorQuestions = conversationHistory.filter((msg) => msg.role === "doctor").length
      return {
        shouldEnd: doctorQuestions >= 6,
        reason: doctorQuestions >= 6 ? "Sufficient information gathered" : "Continue gathering information",
      }
    }
  }

  async generatePatientInformation(
    disease: string,
    specialty: string,
    patientProfile: { name: string; age: number; gender: string; occupation: string },
    symptoms: string[]
  ): Promise<{
    demographics: { maritalStatus: string; insurance: string }
    medicalHistory: string[]
    socialHistory: { smoking: string; alcohol: string; exercise: string }
    familyHistory: { mother: string; father: string }
  }> {
    this.checkAPIKey()
    

    const { text } = await generateText({
      maxOutputTokens: 2048,
      system: `You are a medical AI assistant generating realistic patient information for a medical education case. Create authentic, medically accurate patient data based on the case details. Always respond in the exact format requested.`,
      prompt: `Generate realistic patient information for this medical case:

Patient: ${patientProfile.name}, ${patientProfile.age}-year-old ${patientProfile.gender}, ${patientProfile.occupation}
Disease: ${disease}
Specialty: ${specialty}
Symptoms: ${symptoms.join(", ")}

IMPORTANT: Respond in this EXACT format (no extra text, no explanations):

DEMOGRAPHICS:
Marital Status: [realistic status]
Insurance: [realistic insurance]

MEDICAL_HISTORY:
[item 1]
[item 2]
[item 3]

SOCIAL_HISTORY:
Smoking: [realistic smoking history]
Alcohol: [realistic alcohol use]
Exercise: [realistic exercise habits]

FAMILY_HISTORY:
Mother: [realistic family history]
Father: [realistic family history]`
    })


    // Parse the response with improved error handling
    const parseSection = (label: string) => {
      const regex = new RegExp(`${label}[\\s\\*]*:?\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, "i")
      const match = text.match(regex)
      const result = match ? match[1].trim() : ""
      return result
    }

    const parseListSection = (label: string) => {
      const content = parseSection(label)
      const items = content.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(item => item.length > 0)
      return items
    }

    const parseKeyValue = (label: string, key: string) => {
      const content = parseSection(label)
      const regex = new RegExp(`${key}[\\s\\*]*:?\\s*([^\\n]+)`, "i")
      const match = content.match(regex)
      const result = match ? match[1].trim() : ""
      return result
    }

    const result = {
      demographics: {
        maritalStatus: parseKeyValue("DEMOGRAPHICS", "Marital Status") || "Single",
        insurance: parseKeyValue("DEMOGRAPHICS", "Insurance") || "Private Insurance"
      },
      medicalHistory: parseListSection("MEDICAL_HISTORY").length > 0 ? parseListSection("MEDICAL_HISTORY") : ["No significant medical history"],
      socialHistory: {
        smoking: parseKeyValue("SOCIAL_HISTORY", "Smoking") || "Never smoked",
        alcohol: parseKeyValue("SOCIAL_HISTORY", "Alcohol") || "Social drinking",
        exercise: parseKeyValue("SOCIAL_HISTORY", "Exercise") || "Regular exercise"
      },
      familyHistory: {
        mother: parseKeyValue("FAMILY_HISTORY", "Mother") || "No significant family history",
        father: parseKeyValue("FAMILY_HISTORY", "Father") || "No significant family history"
      }
    }

    return result
  }

  async generateEducationalSOAPNote(
    conversationHistory: LearningConversationMessage[],
    context: ConversationContext,
  ): Promise<LearningSOAPNote> {
    this.checkAPIKey()

    const { disease, patientProfile, symptoms } = context
    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    // If no conversation, generate SOAP note based on case data only
    const isCaseOnly = conversationHistory.length === 0

    try {
      const { text } = await generateText({
        maxOutputTokens: 8192,
        system: isCaseOnly
          ? `You are an experienced doctor writing an educational SOAP note for a medical student based only on the following case information (no conversation yet).

OUTPUT RULES — PLAIN TEXT ONLY:
- Write normal prose only. Do not use Markdown or any Markdown-like formatting.
- Do not use # headings, **bold**, *italic*, bullet lines starting with "-", "*" or "•", numbered lists like "1.", code fences (\`\`\`), tables, or blockquotes.
- The ONLY structure allowed is the labeled lines below (SUBJECTIVE:, etc.), each followed by plain sentences.`
          : `You are an experienced doctor writing an educational SOAP note for ${disease}. Based on the patient conversation, create a comprehensive SOAP note with detailed explanations for each section to help medical students learn.

OUTPUT RULES — PLAIN TEXT ONLY:
- Write normal prose only. Do not use Markdown or any Markdown-like formatting.
- Do not use # headings, **bold**, *italic*, bullet lines starting with "-", "*" or "•", numbered lists like "1.", code fences (\`\`\`), tables, or blockquotes.
- The ONLY structure allowed is the labeled lines below (SUBJECTIVE:, etc.), each followed by plain sentences.`,
        prompt: isCaseOnly
          ? `Patient: ${patientProfile.name}, ${patientProfile.age}-year-old ${patientProfile.gender}
Disease: ${disease}
Symptoms: ${symptoms.join(", ")}
Write an educational SOAP note for this case, including explanations for each section. 
IMPORTANT: Do NOT leave any section blank. Each section must have a detailed, relevant answer. 

Use EXACTLY this plain-text template (no Markdown anywhere — only plain sentences after each label line):

SUBJECTIVE: [detailed subjective findings]
SUBJECTIVE_EXPLANATION: [explanation for subjective]
OBJECTIVE: [detailed objective findings]
OBJECTIVE_EXPLANATION: [explanation for objective]
ASSESSMENT: [detailed assessment]
ASSESSMENT_EXPLANATION: [explanation for assessment]
PLAN: [detailed plan]
PLAN_EXPLANATION: [explanation for plan]`
          : `Patient: ${patientProfile.name}, ${patientProfile.age}-year-old ${patientProfile.gender}
Conversation:
${conversationContext}
Create an educational SOAP note with explanations for this ${disease} case.
IMPORTANT: Do NOT leave any section blank. Each section must have a detailed, relevant answer.

Use EXACTLY this plain-text template (no Markdown anywhere — only plain sentences after each label line):

SUBJECTIVE: [detailed subjective findings]
SUBJECTIVE_EXPLANATION: [explanation for subjective]
OBJECTIVE: [detailed objective findings]
OBJECTIVE_EXPLANATION: [explanation for objective]
ASSESSMENT: [detailed assessment]
ASSESSMENT_EXPLANATION: [explanation for assessment]
PLAN: [detailed plan]
PLAN_EXPLANATION: [explanation for plan]`,
      })

      // Robust section parsing (case-insensitive, allow headings, allow Markdown)
      const parseSection = (label: string) => {
        const regex = new RegExp(
          `(?:^|\\n)(?:\\*\\*|##)?\\s*${label.replace("_", "[ _]")}[\\s\\*]*:?\\s*([\\s\\S]*?)(?=\\n(?:\\*\\*|##)?\\s*[A-Z][A-Z _]+[\\s\\*]*:?|$)`,
          "i"
        )
        const match = text.match(regex)
        return match ? match[1].trim().replace(/^\*\*|\*\*$/g, "") : ""
      }

      return {
        subjective: parseSection("SUBJECTIVE"),
        subjectiveExplanation: parseSection("SUBJECTIVE_EXPLANATION"),
        objective: parseSection("OBJECTIVE"),
        objectiveExplanation: parseSection("OBJECTIVE_EXPLANATION"),
        assessment: parseSection("ASSESSMENT"),
        assessmentExplanation: parseSection("ASSESSMENT_EXPLANATION"),
        plan: parseSection("PLAN"),
        planExplanation: parseSection("PLAN_EXPLANATION"),
      }
    } catch (error) {
      console.error("Error generating educational SOAP note:", error)
      throw error instanceof Error ? error : new Error("Failed to generate educational SOAP note")
    }
  }

  async generateVitalSigns(
    disease: string,
    specialty: string,
    patientProfile: { name: string; age: number; gender: string; occupation: string },
    symptoms: string[],
  ): Promise<{ bloodPressure: string; heartRate: number; temperature: string; respiratoryRate: number }> {
    this.checkAPIKey()

    try {
      const { text } = await generateText({
        jsonMode: true,
        maxOutputTokens: 512,
        system: `You are an experienced physician generating realistic vital signs for a patient with ${disease}. 

Patient Profile:
- Age: ${patientProfile.age}
- Gender: ${patientProfile.gender}
- Occupation: ${patientProfile.occupation}
- Disease: ${disease}
- Specialty: ${specialty}
- Symptoms: ${symptoms.join(", ")}

Generate realistic vital signs that would be appropriate for this patient's condition. Consider:
1. Age-appropriate normal ranges (elderly patients typically have higher BP, younger patients lower)
2. Disease-specific abnormalities (infections cause fever, cardiac conditions affect BP/HR, etc.)
3. Severity of the condition (acute vs chronic presentations)
4. Clinical realism and medical accuracy

IMPORTANT: Generate medically appropriate vital signs that reflect the patient's condition. Do NOT use generic normal values.

Respond with ONLY a JSON object in this exact format:
{
  "bloodPressure": "systolic/diastolic",
  "heartRate": number,
  "temperature": "temp°F",
  "respiratoryRate": number
}`,
        prompt: `Generate realistic vital signs for a ${patientProfile.age}-year-old ${patientProfile.gender} with ${disease}. The patient presents with symptoms: ${symptoms.join(", ")}.`,
      })

      // Parse the JSON response with better error handling
      let cleanedText = text.trim()
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json|```/g, '').trim()
      
      // Extract JSON from the response if it's embedded in other text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedText = jsonMatch[0]
      }
      
      const vitalSigns = JSON.parse(cleanedText)
      
      // Validate the response
      if (!vitalSigns.bloodPressure || !vitalSigns.heartRate || !vitalSigns.temperature || !vitalSigns.respiratoryRate) {
        throw new Error("Incomplete vital signs data received from LLM")
      }
      
      return {
        bloodPressure: vitalSigns.bloodPressure,
        heartRate: vitalSigns.heartRate,
        temperature: vitalSigns.temperature,
        respiratoryRate: vitalSigns.respiratoryRate
      }
    } catch (error) {
      console.error("Error generating vital signs with LLM:", error)
      
      // Retry once with a different approach
      try {
        const { text: retryText } = await generateText({
          jsonMode: true,
          maxOutputTokens: 512,
          system: `Generate vital signs for a patient with ${disease}. Age: ${patientProfile.age}, Gender: ${patientProfile.gender}. Return only JSON.`,
          prompt: `Patient has ${disease}. Generate realistic vital signs as JSON: {"bloodPressure": "systolic/diastolic", "heartRate": number, "temperature": "temp°F", "respiratoryRate": number}`,
        })
        
        const retryCleanedText = retryText.trim().replace(/```json|```/g, '').trim()
        const jsonMatch = retryCleanedText.match(/\{[\s\S]*\}/)
        const finalText = jsonMatch ? jsonMatch[0] : retryCleanedText
        const retryVitalSigns = JSON.parse(finalText)
        
        return {
          bloodPressure: retryVitalSigns.bloodPressure || "120/80",
          heartRate: retryVitalSigns.heartRate || 72,
          temperature: retryVitalSigns.temperature || "98.6°F",
          respiratoryRate: retryVitalSigns.respiratoryRate || 16
        }
      } catch (retryError) {
        console.error("LLM vital signs generation failed on retry:", retryError)
        throw new Error("Failed to generate vital signs with LLM after retry")
      }
    }
  }

  async answerStudentQuestion(
    studentQuestion: string,
    context: ConversationContext,
    conversationHistory: LearningConversationMessage[],
  ): Promise<string> {
    this.checkAPIKey()

    const { disease } = context
    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        maxOutputTokens: 1536,
        system: `You are an experienced medical educator and doctor. A medical student is observing a patient consultation for ${disease} and has asked you a question.

Provide a clear, educational response that helps the student understand:
1. The medical concepts involved
2. The clinical reasoning
3. How this relates to the diagnosis and treatment of ${disease}

Be encouraging and educational in your response.

Current conversation context:
${conversationContext}`,
        prompt: `The student asks: "${studentQuestion}"

Provide an educational response about this ${disease} case.`,
      })

      return text
    } catch (error) {
      console.error("Error answering student question:", error)
      return "That's a great question! In clinical practice, we always consider multiple factors when making diagnostic and treatment decisions. Keep observing and asking questions - that's how you learn!"
    }
  }

  private normalizeLocalKey(session: LearningSession): LearningSession {
    const localKey = `${LEARN_PREFIX}${session.caseId}`
    if (session.id === localKey) return session
    if (isLikelyCuid(session.id) && !session.conversationId) {
      session.conversationId = session.id
    }
    session.id = localKey
    return session
  }

  /** @deprecated Learning sessions persist to MedPrep DB only — no browser storage. */
  private persistLocal(_session: LearningSession): void {
    // Intentionally empty: all learning state is stored in medprep_conversations (+ soap_notes).
  }

  /**
   * Mark an active backend session abandoned so "Start fresh" can open a new ACTIVE session for the same case.
   */
  async abandonBackendSession(userId: string, conversationId: string): Promise<void> {
    if (!userId || userId === "anonymous" || !conversationId) return
    try {
      const res = await fetch(
        `/api/conversations/${encodeURIComponent(conversationId)}?userId=${encodeURIComponent(userId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ABANDONED" }),
        }
      )
      if (!res.ok) {
        const t = await res.text().catch(() => "")
        console.warn("[learning] abandon session failed", res.status, t.slice(0, 200))
      }
    } catch (e) {
      console.warn("[learning] abandon session error", e)
    }
  }

  /**
   * Maps a Medprep session payload (from GET /medprep-ai/sessions/:id) into a LearningSession.
   */
  hydrateLearningSessionFromBackend(
    conv: any,
    opts: { userId: string; medicalCase?: any }
  ): LearningSession {
    const caseId = conv.caseId || opts.medicalCase?.id || ""
    const localKey = `${LEARN_PREFIX}${caseId}`
    const meta = (conv.metadata || {}) as Record<string, unknown>
    const learningState = (meta.learningState || {}) as LearningMetadataState
    const snap = (meta.caseSnapshot || {}) as Record<string, unknown>
    const profile =
      opts.medicalCase?.patientProfile ||
      (snap.patientProfile as LearningSession["patientProfile"])
    const safeProfile =
      profile && typeof profile === "object" && "name" in profile
        ? (profile as LearningSession["patientProfile"])
        : { name: "Patient", age: 40, gender: "Unknown", occupation: "Unknown" }

    const disease =
      opts.medicalCase?.disease || (typeof conv.title === "string" && conv.title) || "Learning case"

    const rawMessages = Array.isArray(conv.messages) ? conv.messages : []
    const messages = collapseLegacyDuplicateAdjacentMessages(rawMessages)
    const conversation: LearningConversationMessage[] = messages.map((msg: any, idx: number) => ({
        id:
          typeof msg.id === "string" && msg.id
            ? msg.id
            : typeof msg.cuid === "string" && msg.cuid
              ? msg.cuid
              : `m-${idx}-${String(msg.createdAt || "")}`,
        role: String(msg.role || "")
          .toLowerCase()
          .trim() as "doctor" | "patient" | "student",
        content: String(msg.content || ""),
        explanation:
          msg.metadata && typeof msg.metadata === "object" && "explanation" in msg.metadata
            ? String((msg.metadata as { explanation?: string }).explanation || "")
            : undefined,
        timestamp:
          typeof msg.createdAt === "string"
            ? msg.createdAt
            : msg.createdAt instanceof Date
              ? msg.createdAt.toISOString()
              : new Date().toISOString(),
      }))

    const patientInfo =
      learningState.patientInfo && typeof learningState.patientInfo === "object"
        ? learningState.patientInfo
        : undefined
    const vitalSigns =
      learningState.vitalSigns && typeof learningState.vitalSigns === "object"
        ? learningState.vitalSigns
        : undefined
    const uiState =
      learningState.uiState && typeof learningState.uiState === "object"
        ? learningState.uiState
        : undefined
    let soapNote =
      learningState.soapNote && typeof learningState.soapNote === "object"
        ? (learningState.soapNote as LearningSOAPNote)
        : undefined

    const latestSoap = Array.isArray(conv.soapNotes) ? conv.soapNotes[0] : null
    if (latestSoap && typeof latestSoap === "object") {
      const row = latestSoap as Record<string, unknown>
      const base = {
        subjective: String(row.subjective ?? ""),
        objective: String(row.objective ?? ""),
        assessment: String(row.assessment ?? ""),
        plan: String(row.plan ?? ""),
      }
      soapNote = {
        subjective: base.subjective,
        subjectiveExplanation: soapNote?.subjectiveExplanation ?? "",
        objective: base.objective,
        objectiveExplanation: soapNote?.objectiveExplanation ?? "",
        assessment: base.assessment,
        assessmentExplanation: soapNote?.assessmentExplanation ?? "",
        plan: base.plan,
        planExplanation: soapNote?.planExplanation ?? "",
      }
    }

    const isComplete = conv.status === "COMPLETED" || Boolean(learningState.isComplete)

    return {
      id: localKey,
      caseId,
      disease,
      studentId: opts.userId,
      conversationId: conv.id,
      lastSyncedMessageCount: conversation.length,
      patientProfile: safeProfile,
      conversation,
      soapNote: soapNote || undefined,
      isComplete,
      createdAt: typeof conv.startedAt === "string" ? conv.startedAt : new Date().toISOString(),
      patientInfo,
      vitalSigns,
      uiState,
    }
  }

  // Database-based session management (idempotent message sync + metadata learningState)
  async saveLearningSession(session: LearningSession): Promise<void> {
    this.normalizeLocalKey(session)
    const queueKey = session.conversationId || session.id
    const previous = this.saveQueues.get(queueKey) || Promise.resolve()
    const current = previous.then(() => this.saveLearningSessionInternal(session))
    this.saveQueues.set(queueKey, current.catch(() => undefined))
    return current
  }

  private async saveLearningSessionInternal(session: LearningSession): Promise<void> {
    const n = session.conversation.length
    if ((session.lastSyncedMessageCount ?? 0) > n) {
      session.lastSyncedMessageCount = n
    }

    const userId = session.studentId?.trim()
    if (!userId || userId === "anonymous") {
      this.persistLocal(session)
      return
    }

    try {
      let conversationId = session.conversationId

      if (!conversationId) {
        const conversationResponse = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            caseId: session.caseId,
            mode: "LEARNING",
            caseTitle: session.disease,
            metadata: {
              learningState: {
                patientInfo: session.patientInfo,
                vitalSigns: session.vitalSigns,
                uiState: session.uiState,
              },
            },
          }),
        })
        const conversationData = await conversationResponse.json().catch(() => null)
        if (conversationResponse.ok && conversationData?.success && conversationData.conversation?.id) {
          conversationId = conversationData.conversation.id
          session.conversationId = conversationId
        }
      }

      if (!conversationId) {
        this.persistLocal(session)
        return
      }

      const persistedCount = this.persistedMessageCounts.get(conversationId) ?? 0
      const already = Math.max(0, session.lastSyncedMessageCount ?? 0, persistedCount)
      let syncedThrough = already
      for (let i = already; i < session.conversation.length; i++) {
        const message = session.conversation[i]
        const role = String(message.role).toUpperCase()
        const body: Record<string, unknown> = {
          role,
          content: message.content,
          isIntervention: false,
        }
        if (message.explanation) {
          body.metadata = { explanation: message.explanation }
        }
        const msgRes = await fetch(
          `/api/conversations/${encodeURIComponent(conversationId)}/messages?userId=${encodeURIComponent(userId)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        )
        if (!msgRes.ok) {
          const errText = await msgRes.text().catch(() => "")
          console.error("[learning] add message failed", msgRes.status, errText.slice(0, 300))
          break
        }
        syncedThrough = i + 1
      }
      session.lastSyncedMessageCount = syncedThrough
      this.persistedMessageCounts.set(conversationId, session.lastSyncedMessageCount)

      const learningState: LearningMetadataState = {
        patientInfo: session.patientInfo,
        vitalSigns: session.vitalSigns,
        uiState: session.uiState,
        soapNote: session.soapNote,
        isComplete: session.isComplete,
      }

      const patchBody: Record<string, unknown> = {
        metadata: { learningState },
      }
      if (session.isComplete) {
        patchBody.status = "COMPLETED"
      }

      const metadataFingerprint =
        `${session.lastSyncedMessageCount}:${JSON.stringify(patchBody.metadata)}:${String(patchBody.status ?? "")}`
      if (this.lastSyncedMetadataFingerprintByConversation.get(conversationId) === metadataFingerprint) {
        return
      }

      const patchRes = await fetch(
        `/api/conversations/${encodeURIComponent(conversationId)}?userId=${encodeURIComponent(userId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        }
      )
      if (!patchRes.ok) {
        const errText = await patchRes.text().catch(() => "")
        console.error("[learning] PATCH session failed", patchRes.status, errText.slice(0, 300))
      } else {
        this.lastSyncedMetadataFingerprintByConversation.set(conversationId, metadataFingerprint)
      }

      if (session.soapNote) {
        const sn = session.soapNote
        const hasSoap =
          sn.subjective?.trim() ||
          sn.objective?.trim() ||
          sn.assessment?.trim() ||
          sn.plan?.trim()
        if (hasSoap) {
          await saveSoapDraft({
            conversationId,
            userId,
            subjective: sn.subjective || "",
            objective: sn.objective || "",
            assessment: sn.assessment || "",
            plan: sn.plan || "",
          })
        }
      }
    } catch (error) {
      console.error("Error saving session to database:", error)
    }
  }

  getLearningSessionsForUser(): LearningSession[] {
    return []
  }

  /** Browser cache removed — load via `getLearningSessionFromDatabase` or active session props. */
  getLearningSession(_sessionId: string): LearningSession | null {
    return null
  }

  async resolveLearningSessionFromDatabase(
    caseId: string,
    userId: string,
    conversationId?: string | null,
    medicalCase?: unknown,
  ): Promise<LearningSession | null> {
    if (!userId || userId === "anonymous") return null
    if (conversationId) {
      return this.getLearningSessionFromDatabase(conversationId, userId, medicalCase)
    }
    try {
      const q = new URLSearchParams({ userId, mode: "LEARNING" })
      q.set("status", "ACTIVE")
      q.set("caseId", caseId)
      const res = await fetch(`/api/conversations?${q}`)
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success && Array.isArray(data.conversations) && data.conversations[0]?.id) {
        return this.getLearningSessionFromDatabase(data.conversations[0].id, userId, medicalCase)
      }
    } catch (e) {
      console.warn("[learning] resolve session failed", e)
    }
    return null
  }

  async getLearningSessionFromDatabase(
    conversationId: string,
    userId: string,
    medicalCase?: any
  ): Promise<LearningSession | null> {
    if (!conversationId || !userId || userId === "anonymous") return null
    try {
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(conversationId)}?userId=${encodeURIComponent(userId)}`
      )
      const data = await response.json().catch(() => null)

      if (response.ok && data?.success && data.conversation) {
        const conv = data.conversation
        if (conv.mode && conv.mode !== "LEARNING") {
          console.warn("[learning] conversation mode mismatch", conv.mode)
        }
        return this.hydrateLearningSessionFromBackend(conv, { userId, medicalCase })
      }
    } catch (error) {
      console.error("Error getting session from database:", error)
    }

    return null
  }
}

export const learningService = new LearningService()
