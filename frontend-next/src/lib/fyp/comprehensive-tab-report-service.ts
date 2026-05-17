import type { Conversation, MedicalCase } from "./data-models"
import type { ConversationGrading } from "./ai-service"
import type { SOAPGrading } from "./soap-service"
import { BEST_GEMINI_MODEL, runNewGemini } from "./llm-gemini"

export interface ComprehensiveTabReports {
  conversation: {
    narrative: string
    strengths: string[]
    improvements: string[]
    excellentQuestions: string[]
    questionsToImprove: string[]
    missedOpportunities: string[]
  }
  soap: {
    narrative: string
    strengths: string[]
    improvements: string[]
    sectionNotes: {
      subjective: string
      objective: string
      assessment: string
      plan: string
    }
  }
  recommendations: {
    narrative: string
    actionItems: string[]
    studyFocus: string[]
  }
}

export interface GenerateTabReportsInput {
  conversation: Conversation
  medicalCase: MedicalCase
  studentSoap: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
  soapGrading?: SOAPGrading
  conversationGrading?: ConversationGrading | null
  aiReferenceSoap?: {
    subjective?: string
    objective?: string
    assessment?: string
    plan?: string
  } | null
}

function formatTranscript(conversation: Conversation): string {
  return (conversation.messages ?? [])
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")
}

function parseJsonFromLlm<T>(text: string): T {
  const trimmed = text.trim()
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
  try {
    return JSON.parse(unfenced) as T
  } catch {
    const match = unfenced.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("Invalid JSON from comprehensive report model.")
    return JSON.parse(match[0]) as T
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v).trim()).filter(Boolean)
}

function normalizeReports(
  raw: Partial<ComprehensiveTabReports>,
  fallback: ComprehensiveTabReports,
): ComprehensiveTabReports {
  return {
    conversation: {
      narrative:
        String(raw.conversation?.narrative ?? "").trim() ||
        fallback.conversation.narrative,
      strengths: asStringArray(raw.conversation?.strengths).length
        ? asStringArray(raw.conversation?.strengths)
        : fallback.conversation.strengths,
      improvements: asStringArray(raw.conversation?.improvements).length
        ? asStringArray(raw.conversation?.improvements)
        : fallback.conversation.improvements,
      excellentQuestions: asStringArray(raw.conversation?.excellentQuestions).length
        ? asStringArray(raw.conversation?.excellentQuestions)
        : fallback.conversation.excellentQuestions,
      questionsToImprove: asStringArray(raw.conversation?.questionsToImprove).length
        ? asStringArray(raw.conversation?.questionsToImprove)
        : fallback.conversation.questionsToImprove,
      missedOpportunities: asStringArray(raw.conversation?.missedOpportunities).length
        ? asStringArray(raw.conversation?.missedOpportunities)
        : fallback.conversation.missedOpportunities,
    },
    soap: {
      narrative:
        String(raw.soap?.narrative ?? "").trim() || fallback.soap.narrative,
      strengths: asStringArray(raw.soap?.strengths).length
        ? asStringArray(raw.soap?.strengths)
        : fallback.soap.strengths,
      improvements: asStringArray(raw.soap?.improvements).length
        ? asStringArray(raw.soap?.improvements)
        : fallback.soap.improvements,
      sectionNotes: {
        subjective:
          String(raw.soap?.sectionNotes?.subjective ?? "").trim() ||
          fallback.soap.sectionNotes.subjective,
        objective:
          String(raw.soap?.sectionNotes?.objective ?? "").trim() ||
          fallback.soap.sectionNotes.objective,
        assessment:
          String(raw.soap?.sectionNotes?.assessment ?? "").trim() ||
          fallback.soap.sectionNotes.assessment,
        plan:
          String(raw.soap?.sectionNotes?.plan ?? "").trim() ||
          fallback.soap.sectionNotes.plan,
      },
    },
    recommendations: {
      narrative:
        String(raw.recommendations?.narrative ?? "").trim() ||
        fallback.recommendations.narrative,
      actionItems: asStringArray(raw.recommendations?.actionItems).length
        ? asStringArray(raw.recommendations?.actionItems)
        : fallback.recommendations.actionItems,
      studyFocus: asStringArray(raw.recommendations?.studyFocus).length
        ? asStringArray(raw.recommendations?.studyFocus)
        : fallback.recommendations.studyFocus,
    },
  }
}

function buildFallbackReports(input: GenerateTabReportsInput): ComprehensiveTabReports {
  const cg = input.conversationGrading
  const sg = input.soapGrading
  const studentQs =
    input.conversation.messages
      ?.filter((m) => m.role === "student")
      .map((m) => m.content.trim())
      .filter(Boolean) ?? []

  return {
    conversation: {
      narrative: cg?.clinicalInsights
        ? String(cg.clinicalInsights)
        : studentQs.length
          ? `You asked ${studentQs.length} question(s) during the encounter. Review whether your questions built a logical history from chief complaint through associated symptoms and relevant background.`
          : "No student questions were recorded in the transcript. A clinical interview requires structured questioning before documentation.",
      strengths: cg?.strengths ?? [],
      improvements: cg?.improvements ?? [],
      excellentQuestions: cg?.excellentQuestions ?? [],
      questionsToImprove: cg?.poorQuestions ?? [],
      missedOpportunities: cg?.missedOpportunities ?? [],
    },
    soap: {
      narrative:
        sg?.feedback?.overall?.join(" ") ||
        "Your SOAP note was reviewed against structure and completeness for each section.",
      strengths: sg?.strengths ?? [],
      improvements: sg?.improvements ?? [],
      sectionNotes: {
        subjective: sg?.feedback?.subjective?.join(" ") || "",
        objective: sg?.feedback?.objective?.join(" ") || "",
        assessment: sg?.feedback?.assessment?.join(" ") || "",
        plan: sg?.feedback?.plan?.join(" ") || "",
      },
    },
    recommendations: {
      narrative:
        cg?.recommendations?.join("\n\n") ||
        "Focus on systematic interviewing, then align your documentation with findings from the encounter.",
      actionItems: [
        ...(cg?.recommendations ?? []).slice(0, 4),
        ...(sg?.improvements ?? []).slice(0, 2),
      ],
      studyFocus: [
        "History-taking structure",
        "SOAP documentation",
        input.medicalCase.specialty
          ? `${input.medicalCase.specialty} clinical reasoning`
          : "Clinical reasoning",
      ],
    },
  }
}

export async function generateComprehensiveTabReports(
  input: GenerateTabReportsInput,
): Promise<ComprehensiveTabReports> {
  const fallback = buildFallbackReports(input)
  const transcript = formatTranscript(input.conversation)
  const caseBlock = [
    `Case: ${input.medicalCase.title}`,
    `Specialty: ${input.medicalCase.specialty}`,
    `Reference diagnosis (educator only): ${input.medicalCase.diseaseName || input.medicalCase.disease}`,
    `Symptoms: ${(input.medicalCase.symptoms ?? []).join(", ")}`,
    `Patient: ${input.medicalCase.patientProfile?.name}, ${input.medicalCase.patientProfile?.age}y`,
  ].join("\n")

  const studentSoapBlock = [
    `SUBJECTIVE:\n${input.studentSoap.subjective || "(empty)"}`,
    `OBJECTIVE:\n${input.studentSoap.objective || "(empty)"}`,
    `ASSESSMENT:\n${input.studentSoap.assessment || "(empty)"}`,
    `PLAN:\n${input.studentSoap.plan || "(empty)"}`,
  ].join("\n\n")

  const refSoap = input.aiReferenceSoap
    ? [
        `REFERENCE SOAP (educator):\nS: ${input.aiReferenceSoap.subjective ?? ""}\nO: ${input.aiReferenceSoap.objective ?? ""}\nA: ${input.aiReferenceSoap.assessment ?? ""}\nP: ${input.aiReferenceSoap.plan ?? ""}`,
      ].join("\n")
    : ""

  const gradeHints = [
    input.conversationGrading
      ? `Conversation scores — overall ${input.conversationGrading.overallGrade}, question quality ${input.conversationGrading.questionQualityGrade}, reasoning ${input.conversationGrading.clinicalReasoningGrade}.`
      : "",
    input.soapGrading
      ? `SOAP scores — overall ${input.soapGrading.overallGrade}; S/O/A/P ${input.soapGrading.subjectiveGrade}/${input.soapGrading.objectiveGrade}/${input.soapGrading.assessmentGrade}/${input.soapGrading.planGrade}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n")

  const schema = `Return ONLY valid JSON:
{
  "conversation": {
    "narrative": "markdown, 2-4 paragraphs analyzing THIS student's interview only",
    "strengths": ["..."],
    "improvements": ["..."],
    "excellentQuestions": ["quote or paraphrase actual strong questions"],
    "questionsToImprove": ["..."],
    "missedOpportunities": ["..."]
  },
  "soap": {
    "narrative": "markdown, 2-4 paragraphs on THIS student's SOAP vs encounter and case",
    "strengths": ["..."],
    "improvements": ["..."],
    "sectionNotes": {
      "subjective": "short paragraph",
      "objective": "short paragraph",
      "assessment": "short paragraph",
      "plan": "short paragraph"
    }
  },
  "recommendations": {
    "narrative": "markdown, personalized study plan from their performance",
    "actionItems": ["concrete next steps"],
    "studyFocus": ["topics to review"]
  }
}`

  try {
    const text = await runNewGemini(
      BEST_GEMINI_MODEL,
      `You are a senior clinical educator writing post-encounter feedback for a medical student.
Base every statement on the student's actual transcript and SOAP text provided.
Be specific, constructive, and reference what they did or failed to do.
Use markdown in narrative fields (paragraphs, **bold** sparingly, bullet lists where helpful).
Do not invent findings they never documented or asked about.`,
      `${schema}

${caseBlock}

${gradeHints}

--- STUDENT INTERVIEW TRANSCRIPT ---
${transcript || "(no messages)"}

--- STUDENT SOAP NOTE ---
${studentSoapBlock}

${refSoap}`,
      false,
      0,
      false,
      0.25,
      4096,
    )

    const parsed = parseJsonFromLlm<Partial<ComprehensiveTabReports>>(text)
    return normalizeReports(parsed, fallback)
  } catch (error) {
    console.error("[comprehensive-tab-report] AI generation failed:", error)
    return fallback
  }
}
