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

class SOAPAssistantService {
  private async askGemini(prompt: string, maxTokens = 450, temperature = 0.3): Promise<string> {
    const response = await fetch("/api/evaluation/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
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
        `You are an expert medical educator.
Return ONLY valid JSON array.
For SOAP section "${section}", provide 2-3 high-value suggestions.
Case: ${medicalCase.title}; Disease: ${medicalCase.disease}; Symptoms: ${medicalCase.symptoms.join(", ")}
Conversation:\n${conversationContext}
Current section text:\n${currentContent}
JSON format:
[{"suggestion":"...","confidence":0.9,"reasoning":"..."}]`,
        500,
        0.2,
      )

      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")
      const parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed)) return []
      return parsed.map((item) => ({
        section,
        suggestion: String(item?.suggestion || ""),
        confidence: Number(item?.confidence || 0.8),
        reasoning: String(item?.reasoning || ""),
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
        `You are an expert medical educator giving real-time SOAP feedback.
Return ONLY valid JSON array.
Section: ${section}
Case: ${medicalCase.title}; Disease: ${medicalCase.disease}
Conversation:\n${conversationContext}
Section content:\n${content}
JSON format:
[{"feedback":"...","severity":"info|warning|error","suggestion":"..."}]`,
        400,
        0.2,
      )
      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")
      const parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed)) return []
      return parsed.map((item) => ({
        section,
        feedback: String(item?.feedback || ""),
        severity: item?.severity === "error" || item?.severity === "warning" ? item.severity : "info",
        suggestion: item?.suggestion ? String(item.suggestion) : undefined,
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
      const conversationContext = conversation.messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")
      return await this.askGemini(
        `Write a high-quality SOAP ${section} section draft as plain text.
Case: ${medicalCase.title}; Disease: ${medicalCase.disease}
Patient: ${medicalCase.patientProfile.name}, ${medicalCase.patientProfile.age}/${medicalCase.patientProfile.gender}
Conversation:\n${conversationContext}`,
        500,
        0.3,
      )
    } catch (error) {
      console.error("Error generating section draft:", error)
      return `Draft ${section} section could not be generated. Please write based on your conversation with the patient.`
    }
  }
}

export const soapAssistantService = new SOAPAssistantService()
