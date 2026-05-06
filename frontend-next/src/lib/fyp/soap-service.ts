import type { Conversation, MedicalCase, SOAPNote } from "./data-models"
import { learningService } from "./learning-service"
import { getSoapNoteByConversationId, upsertSoapNote } from "./server-medprep-db"

export interface SOAPGrading {
  overallGrade: number
  subjectiveGrade: number
  objectiveGrade: number
  assessmentGrade: number
  planGrade: number
  feedback: {
    subjective: string[]
    objective: string[]
    assessment: string[]
    plan: string[]
    overall: string[]
  }
  strengths: string[]
  improvements: string[]
}

class SOAPService {
  async generateAISOAPNote(conversation: Conversation, medicalCase: MedicalCase): Promise<SOAPNote["aiGeneratedSOAP"]> {
    const context = {
      caseId: medicalCase.id,
      disease: medicalCase.disease,
      diseaseName: medicalCase.diseaseName,
      specialty: medicalCase.specialty,
      isRare: medicalCase.isRare,
      symptoms: medicalCase.symptoms,
      history: medicalCase.history,
      labs: medicalCase.labs,
      patientProfile: medicalCase.patientProfile,
      conversationHistory: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    }

    const soap = await learningService.generateEducationalSOAPNote(conversation.messages, context as any)
    return {
      subjective: soap.subjective || "",
      objective: soap.objective || "",
      assessment: soap.assessment || "",
      plan: soap.plan || "",
    }
  }

  async gradeSOAPNote(
    studentSOAP: Omit<SOAPNote, "id" | "submittedAt" | "grade" | "feedback">,
    aiSOAP: SOAPNote["aiGeneratedSOAP"]
  ): Promise<SOAPGrading> {
    const sectionGrade = (student: string, reference: string) => {
      const studentWords = student.trim().split(/\s+/).filter(Boolean).length
      const refWords = Math.max(reference.trim().split(/\s+/).filter(Boolean).length, 1)
      const ratioScore = Math.min(100, Math.round((studentWords / refWords) * 100))
      const completenessBoost = studentWords > 35 ? 15 : studentWords > 20 ? 8 : 0
      return Math.min(100, ratioScore + completenessBoost)
    }

    const subjectiveGrade = sectionGrade(studentSOAP.subjective, aiSOAP?.subjective || "")
    const objectiveGrade = sectionGrade(studentSOAP.objective, aiSOAP?.objective || "")
    const assessmentGrade = sectionGrade(studentSOAP.assessment, aiSOAP?.assessment || "")
    const planGrade = sectionGrade(studentSOAP.plan, aiSOAP?.plan || "")
    const overallGrade = Math.round((subjectiveGrade + objectiveGrade + assessmentGrade + planGrade) / 4)

    return {
      overallGrade,
      subjectiveGrade,
      objectiveGrade,
      assessmentGrade,
      planGrade,
      feedback: {
        subjective: ["Include chronology and associated symptoms clearly."],
        objective: ["Document vitals and exam findings systematically."],
        assessment: ["State top differentials with concise clinical reasoning."],
        plan: ["Specify investigations, treatment, and follow-up timing."],
        overall: ["Solid structure. Continue improving depth and specificity in each section."],
      },
      strengths: ["SOAP structure is complete.", "Clinical content captures the main case problem."],
      improvements: ["Add more specific objective data.", "Strengthen assessment reasoning with supporting findings."],
    }
  }

  async saveSOAPNote(soapNote: SOAPNote): Promise<void> {
    await upsertSoapNote(soapNote)
  }

  async getSOAPNoteByConversation(conversationId: string): Promise<SOAPNote | null> {
    return getSoapNoteByConversationId(conversationId)
  }
}

export const soapService = new SOAPService()
