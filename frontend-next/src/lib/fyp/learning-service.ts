import type { ConversationContext } from "./ai-service"
import { BEST_GEMINI_MODEL, runNewGemini } from "./llm-gemini"

async function generateText({
  model,
  system,
  prompt,
}: {
  model: string
  system?: string
  prompt: string
}): Promise<{ text: string }> {
  const text = await runNewGemini(model || BEST_GEMINI_MODEL, system || "", prompt, true, 0, true)
  return { text }
}

export interface LearningConversationMessage {
  role: "doctor" | "patient" | "student"
  content: string
  explanation?: string
  timestamp: string
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
  id: string
  caseId: string
  disease: string
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

class LearningService {
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
        prompt: "Say 'API connection successful'"
      })
      console.log("API Test Response:", text)
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
        model: BEST_GEMINI_MODEL,
        system: `You are an experienced doctor conducting a patient interview for educational purposes. You do NOT know the patient's diagnosis - you must investigate and deduce it through questioning.

Patient Profile:
- Name: ${patientProfile.name}
- Age: ${patientProfile.age}
- Gender: ${patientProfile.gender}
- Occupation: ${patientProfile.occupation}
- Known symptoms: ${symptoms.join(", ")}

IMPORTANT: You are investigating an unknown condition. Ask questions that help narrow down differential diagnoses and gather diagnostic information. Do not assume you know the diagnosis.

Your task is to ask the next logical question to gather information for diagnosis. After each question, provide an educational explanation for students about why you asked that specific question.

Format your response as:
QUESTION: [Your question to the patient]
EXPLANATION: [Educational explanation for students about why this question is important for differential diagnosis]

Previous conversation:
${conversationContext}`,
        prompt: `Based on the conversation so far, what is the next most important question to ask this patient to help narrow down the differential diagnosis? Include your educational explanation.`,
      })

      const lines = text.split("\n")
      const questionLine = lines.find((line) => line.startsWith("QUESTION:"))
      const explanationLine = lines.find((line) => line.startsWith("EXPLANATION:"))

      const question = questionLine?.replace("QUESTION:", "").trim() || text.split("EXPLANATION:")[0].trim()
      const explanation =
        explanationLine?.replace("EXPLANATION:", "").trim() ||
        `This question helps gather important diagnostic information for differential diagnosis.`

      return { question, explanation }
    } catch (error) {
      console.error("Error generating doctor question:", error)
      return {
        question: "Can you tell me more about when your symptoms started?",
        explanation: "Understanding the timeline of symptoms is crucial for differential diagnosis.",
      }
    }
  }

  async generatePatientResponse(doctorQuestion: string, context: ConversationContext): Promise<string> {
    this.checkAPIKey()

    const { disease, symptoms, patientProfile } = context

    try {
      const { text } = await generateText({
        model: BEST_GEMINI_MODEL,
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
6. Be descriptive about symptoms, express appropriate concern
7. Share relevant medical history when asked
8. If asked about something unrelated to your condition, gently redirect to your symptoms
9. NEVER reveal the exact diagnosis name unless specifically asked in a way a patient would know it

Respond to the doctor's questions naturally and realistically.`,
        prompt: `The doctor asks: "${doctorQuestion}"

Respond as the patient with ${disease}. You know your exact condition and all associated information. Be realistic, descriptive, and stay in character. Answer consistently with your condition.`,
      })

      return text
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
        model: BEST_GEMINI_MODEL,
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
    
    console.log("Generating patient info with params:", {
      disease,
      specialty,
      patientProfile,
      symptoms
    })

    const { text } = await generateText({
      model: BEST_GEMINI_MODEL,
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

    console.log("LLM Response:", text)

    // Parse the response with improved error handling
    const parseSection = (label: string) => {
      const regex = new RegExp(`${label}[\\s\\*]*:?\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, "i")
      const match = text.match(regex)
      const result = match ? match[1].trim() : ""
      console.log(`Parsed ${label}:`, result)
      return result
    }

    const parseListSection = (label: string) => {
      const content = parseSection(label)
      const items = content.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(item => item.length > 0)
      console.log(`Parsed ${label} list:`, items)
      return items
    }

    const parseKeyValue = (label: string, key: string) => {
      const content = parseSection(label)
      const regex = new RegExp(`${key}[\\s\\*]*:?\\s*([^\\n]+)`, "i")
      const match = content.match(regex)
      const result = match ? match[1].trim() : ""
      console.log(`Parsed ${label} ${key}:`, result)
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

    console.log("Final parsed result:", result)
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
        model: BEST_GEMINI_MODEL,
        system: isCaseOnly
          ? `You are an experienced doctor writing an educational SOAP note for a medical student based only on the following case information (no conversation yet).`
          : `You are an experienced doctor writing an educational SOAP note for ${disease}. Based on the patient conversation, create a comprehensive SOAP note with detailed explanations for each section to help medical students learn.`,
        prompt: isCaseOnly
          ? `Patient: ${patientProfile.name}, ${patientProfile.age}-year-old ${patientProfile.gender}
Disease: ${disease}
Symptoms: ${symptoms.join(", ")}
Write an educational SOAP note for this case, including explanations for each section. 
IMPORTANT: Do NOT leave any section blank. Each section must have a detailed, relevant answer. 
Use this format (plain text, no Markdown, no headings, no asterisks):

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
Use this format (plain text, no Markdown, no headings, no asterisks):

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
      return {
        subjective: `Patient presents with symptoms consistent with ${disease}.`,
        subjectiveExplanation: "Subjective data includes the patient's reported symptoms and history.",
        objective: "Physical examination and vital signs would be documented here.",
        objectiveExplanation: "Objective data includes measurable findings from examination and tests.",
        assessment: `Working diagnosis: ${disease}`,
        assessmentExplanation: "Assessment includes the diagnostic reasoning and differential diagnosis.",
        plan: "Treatment plan based on diagnosis and patient factors.",
        planExplanation: "Plan outlines the therapeutic approach and follow-up care.",
      }
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
        model: BEST_GEMINI_MODEL,
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
        console.log("Retrying vital signs generation...")
        const { text: retryText } = await generateText({
          model: BEST_GEMINI_MODEL,
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
        model: BEST_GEMINI_MODEL,
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

  // Database-based session management
  async saveLearningSession(session: LearningSession): Promise<void> {
    try {
      const userId = (session as any).studentId || "anonymous"
      let conversationId = session.id
      if (!conversationId.startsWith("conv_") && !conversationId.startsWith("c")) {
        const conversationResponse = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            caseId: session.caseId,
            mode: "LEARNING",
            caseTitle: session.disease,
          }),
        })
        const conversationData = await conversationResponse.json()
        if (conversationData.success) {
          conversationId = conversationData.conversation.id
          session.id = conversationId
        }
      }

      if (conversationId) {
        for (const message of session.conversation) {
          await fetch(`/api/conversations/${conversationId}/messages?userId=${encodeURIComponent(userId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: message.role.toUpperCase(),
              content: message.content,
              isIntervention: false
            })
          })
        }

      }
    } catch (error) {
      console.error('Error saving session to database:', error)
    }

    // Also save to localStorage as backup
    const sessions = this.getLearningSessionsForUser()
    const existingIndex = sessions.findIndex((s) => s.id === session.id)

    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.push(session)
    }

    localStorage.setItem("learning_sessions", JSON.stringify(sessions))
  }

  getLearningSessionsForUser(): LearningSession[] {
    const sessions = localStorage.getItem("learning_sessions")
    return sessions ? JSON.parse(sessions) : []
  }

  getLearningSession(sessionId: string): LearningSession | null {
    const sessions = this.getLearningSessionsForUser()
    return sessions.find((s) => s.id === sessionId) || null
  }

  // New method to get session from database
  async getLearningSessionFromDatabase(sessionId: string): Promise<LearningSession | null> {
    try {
      const response = await fetch(`/api/conversations/${sessionId}?userId=anonymous`)
      const data = await response.json()
      
      if (data.success && data.conversation) {
        const conv = data.conversation
        return {
          id: conv.id,
          caseId: conv.caseId,
          disease: conv.case?.title || 'Unknown',
          patientProfile: {
            name: 'Patient',
            age: 45,
            gender: 'Unknown',
            occupation: 'Unknown'
          },
          conversation: conv.messages.map((msg: any) => ({
            role: msg.role.toLowerCase() as 'doctor' | 'patient' | 'student',
            content: msg.content,
            timestamp: msg.createdAt
          })),
          isComplete: conv.status === 'COMPLETED',
          createdAt: conv.startedAt
        }
      }
    } catch (error) {
      console.error('Error getting session from database:', error)
    }
    
    return null
  }
}

export const learningService = new LearningService()
