import type { MedicalCase, Conversation } from "./data-models"

export interface SOAPSuggestion {
  section: "subjective" | "objective" | "assessment" | "plan"
  suggestion: string
  confidence: number
  reasoning: string
}

export interface RealTimeFeedback {
  section: "subjective" | "objective" | "assessment" | "plan"
  feedback: string
  severity: "info" | "warning" | "error"
  suggestion?: string
}

/** Strip HTML-like fragments, Markdown, and common “[Insert …]” template junk for safe chart text. */
export function sanitizeSoapDraftForChart(raw: string): string {
  let t = String(raw ?? "").replace(/\r\n/g, "\n")

  // Remove HTML/XML-like angle-bracket chunks (safe for textarea / mixed rendering).
  t = t.replace(/<[^>\n]{0,800}>/g, "")

  // Markdown headings at line start
  t = t.replace(/^#{1,6}\s+/gm, "")

  // Bold / italic markers (iterative unwrap)
  for (let i = 0; i < 6; i++) {
    const next = t
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/_([^_\n]+)_/g, "$1")
    if (next === t) break
    t = next
  }
  t = t.replace(/\*{2,}/g, "").replace(/_{2,}/g, "")

  // Template placeholders (case-insensitive)
  t = t.replace(/\[(?:\*\*)?\s*Insert[\s\S]*?\]/gi, "")
  t = t.replace(/\[\s*TBD[\s\S]*?\]/gi, "")
  t = t.replace(/\[\s*TODO[\s\S]*?\]/gi, "")
  t = t.replace(/\[\s*Fill\s+in[\s\S]*?\]/gi, "")

  // Normalize bullet lines that used markdown asterisks
  t = t.replace(/^\s*\*\s+/gm, "• ")

  t = t.replace(/\n{3,}/g, "\n\n").trim()
  return t
}

function formatCaseFacts(medicalCase: MedicalCase): string {
  const symptoms = Array.isArray(medicalCase.symptoms) ? medicalCase.symptoms.filter(Boolean).join(", ") : ""
  const history = Array.isArray(medicalCase.history) ? medicalCase.history.filter(Boolean).join("; ") : ""
  const labs =
    medicalCase.labs && typeof medicalCase.labs === "object"
      ? Object.entries(medicalCase.labs)
          .slice(0, 12)
          .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
          .join("\n")
      : ""
  const profile = medicalCase.patientProfile
  return [
    `Title: ${medicalCase.title}`,
    `Specialty: ${medicalCase.specialty}; Difficulty: ${medicalCase.difficulty}`,
    `Patient: ${profile?.name ?? "Unknown"}, ${profile?.age ?? "?"}y, ${profile?.gender ?? ""}, ${profile?.occupation ?? ""}`,
    medicalCase.description ? `Case summary: ${medicalCase.description}` : "",
    symptoms ? `Presenting symptoms / clues: ${symptoms}` : "",
    history ? `Relevant history items: ${history}` : "",
    labs ? `Labs / data:\n${labs}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

function sectionDraftSystemRules(section: string): string {
  return `You are an expert clinician writing ONE section of a medical SOAP note for documentation (not teaching templates).

OUTPUT RULES (strict):
1) Plain text ONLY for pasting into an EHR textarea. No HTML tags, no XML, no <angle brackets> except spelled-out words.
2) No Markdown: no **, no # headings, no bullet lines starting with * or - unless you use a simple "• " prefix sparingly.
3) NO placeholders: never write [Insert ...], [TBD], brackets with instructions, or "____". Every sentence must be finished clinical prose grounded in the case facts and transcript.
4) If the transcript is very short, still write a coherent ${section} section using the structured case facts (demographics, symptoms, case description). Do not fabricate contradictory facts; reasonable clinical inference from the case is allowed.
5) Do not prepend labels like "S:" or "Subjective:" unless the section naturally needs a one-line header — prefer flowing paragraph(s) with clear PMH/Meds/SH/FH blocks where applicable.
6) Use standard medical abbreviations where natural (e.g., NKDA, PMH). Avoid decorative Unicode.
7) Keep length appropriate for a single SOAP section (concise but complete).`
}

function sectionDraftUserPayload(
  section: "subjective" | "objective" | "assessment" | "plan",
  conversationContext: string,
  caseBlock: string,
): string {
  const guides: Record<typeof section, string> = {
    subjective: `Write the SUBJECTIVE section only.
Include: chief complaint in the patient's context, HPI with onset/timing/quality/severity/location/radiation/aggravating/relieving factors and pertinent associated symptoms, relevant PMH/PSH/meds/allergies, social and family history as supported by the case, and a brief pertinent ROS (positives and key negatives).`,
    objective: `Write the OBJECTIVE section only.
Include: vital signs appropriate to the case, focused physical exam by system, and available labs/imaging/impression from the case data. If a value is not in the case, omit it rather than inventing numbers.`,
    assessment: `Write the ASSESSMENT section only.
Include: working diagnosis/differential tied to subjective and objective findings, brief clinical reasoning, and severity/risk comment if appropriate.`,
    plan: `Write the PLAN section only.
Include: diagnostics, therapeutics, monitoring, patient education, and follow-up as appropriate to the case.`,
  }

  return `SOAP section to write: ${section.toUpperCase()}

${guides[section]}

--- Structured case facts (ground truth for drafting) ---
${caseBlock}

--- Visit transcript (student / patient / doctor lines) ---
${conversationContext || "(No transcript lines yet — rely on structured case facts above.)"}

Produce ONLY the ${section} section body now.`
}

class SOAPAssistantService {
  private async askGemini(
    messages: { role: string; content: string }[],
    maxTokens = 450,
    temperature = 0.3,
  ): Promise<string> {
    const response = await fetch("/api/evaluation/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages,
        maxTokens,
        temperature,
      }),
    })

    const raw = await response.text()
    let payload: any = null
    try {
      payload = raw ? JSON.parse(raw) : null
    } catch {
      throw new Error(`Invalid AI response (${response.status})`)
    }
    if (!response.ok) {
      throw new Error(payload?.error || "AI request failed")
    }
    return String(payload?.text || "").trim()
  }

  async generateSOAPSuggestions(
    section: "subjective" | "objective" | "assessment" | "plan",
    currentContent: string,
    conversation: Conversation,
    medicalCase: MedicalCase,
  ): Promise<SOAPSuggestion[]> {
    try {
      const conversationContext = conversation.messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")
      const text = await this.askGemini(
        [
          {
            role: "user",
            content: `You are an expert medical educator.
Return ONLY valid JSON array.
For SOAP section "${section}", provide 2-3 high-value suggestions.
Case: ${medicalCase.title}; Disease: ${medicalCase.disease}; Symptoms: ${(medicalCase.symptoms || []).join(", ")}
Conversation:\n${conversationContext}
Current section text:\n${currentContent}
JSON format:
[{"suggestion":"...","confidence":0.9,"reasoning":"..."}]`,
          },
        ],
        500,
        0.2,
      )

      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")
      const parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed)) return []
      return parsed.map((item) => ({
        section,
        suggestion: sanitizeSoapDraftForChart(String(item?.suggestion || "")),
        confidence: Number(item?.confidence || 0.8),
        reasoning: sanitizeSoapDraftForChart(String(item?.reasoning || "")),
      }))
    } catch (error) {
      console.error("Error generating SOAP suggestions:", error)
      return []
    }
  }

  async getRealTimeFeedback(
    section: "subjective" | "objective" | "assessment" | "plan",
    content: string,
    conversation: Conversation,
    medicalCase: MedicalCase,
  ): Promise<RealTimeFeedback[]> {
    if (!content.trim()) return []
    try {
      const conversationContext = conversation.messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")
      const text = await this.askGemini(
        [
          {
            role: "user",
            content: `You are an expert medical educator giving real-time SOAP feedback.
Return ONLY valid JSON array.
Section: ${section}
Case: ${medicalCase.title}; Disease: ${medicalCase.disease}
Conversation:\n${conversationContext}
Section content:\n${content}
JSON format:
[{"feedback":"...","severity":"info|warning|error","suggestion":"..."}]`,
          },
        ],
        400,
        0.2,
      )
      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")
      const parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed)) return []
      return parsed.map((item) => ({
        section,
        feedback: sanitizeSoapDraftForChart(String(item?.feedback || "")),
        severity: item?.severity === "error" || item?.severity === "warning" ? item.severity : "info",
        suggestion: item?.suggestion ? sanitizeSoapDraftForChart(String(item.suggestion)) : undefined,
      }))
    } catch (error) {
      console.error("Error getting real-time feedback:", error)
      return []
    }
  }

  async generateSectionDraft(
    section: "subjective" | "objective" | "assessment" | "plan",
    conversation: Conversation,
    medicalCase: MedicalCase,
  ): Promise<string> {
    try {
      const messages = Array.isArray(conversation.messages) ? conversation.messages : []
      const conversationContext = messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")
      const caseBlock = formatCaseFacts(medicalCase)

      const maxBySection: Record<typeof section, number> = {
        subjective: 2800,
        objective: 2200,
        assessment: 1800,
        plan: 1800,
      }

      const raw = await this.askGemini(
        [
          { role: "system", content: sectionDraftSystemRules(section) },
          { role: "user", content: sectionDraftUserPayload(section, conversationContext, caseBlock) },
        ],
        maxBySection[section],
        0.2,
      )

      return sanitizeSoapDraftForChart(raw)
    } catch (error) {
      console.error("Error generating section draft:", error)
      return `Draft ${section} section could not be generated. Please write based on your conversation with the patient.`
    }
  }
}

export const soapAssistantService = new SOAPAssistantService()
