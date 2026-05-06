"use client"

import type { Conversation, MedicalCase, ChatMessage } from "./data-models"
import { diagnosisService } from "./diagnosis-service"
import { aiHintTrackingService, type HintGradeImpact } from "./ai-hint-tracking-service"
import { BEST_GEMINI_MODEL, runNewGemini } from "./llm-gemini"

export interface PracticeSessionGrade {
  baseGrade: number
  hintPenalty: number
  finalGrade: number
  gradeLetter: string
  breakdown: {
    conversationQuality: number
    clinicalReasoning: number
    questionEffectiveness: number
    diagnosticAccuracy: number
    communicationSkills: number
  }
  hintImpact: HintGradeImpact
  feedback: {
    strengths: string[]
    improvements: string[]
    recommendations: string[]
  }
  detailedAnalysis: {
    questionQuality: string
    clinicalReasoning: string
    diagnosticProcess: string
    communication: string
  }
}

class PracticeGradingService {
  private checkAPIKey(): void {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is missing.")
    }
  }

  async gradePracticeSession(
    conversation: Conversation,
    medicalCase: MedicalCase,
    sessionId: string
  ): Promise<PracticeSessionGrade> {
    this.checkAPIKey()

    // Get hint usage data
    const hintSession = aiHintTrackingService.getSession(sessionId)
    const hintImpact = hintSession 
      ? aiHintTrackingService.calculateFinalGrade(0, sessionId) // We'll calculate base grade first
      : aiHintTrackingService.calculateFinalGrade(0, sessionId)

    // Generate base grade through AI analysis
    const baseGrade = await this.generateBaseGrade(conversation, medicalCase)

    // Factor in diagnosis correctness (latest submission for this conversation)
    const latestDx = diagnosisService.getLatestConversationSubmission(conversation.id)
    const diagnosisBonusOrPenalty = latestDx ? (latestDx.isCorrect ? 5 : -10) : 0
    const adjustedBase = Math.max(0, Math.min(100, baseGrade + diagnosisBonusOrPenalty))
    
    // Calculate final grade with hint penalties
    const finalHintImpact = aiHintTrackingService.calculateFinalGrade(adjustedBase, sessionId)
    
    // Generate detailed feedback
    const feedback = await this.generateDetailedFeedback(conversation, medicalCase, finalHintImpact)
    
    // Calculate breakdown scores
    const breakdown = await this.calculateBreakdownScores(conversation, medicalCase, finalHintImpact)

    return {
      baseGrade: adjustedBase,
      hintPenalty: finalHintImpact.hintPenalty,
      finalGrade: finalHintImpact.finalGrade,
      gradeLetter: finalHintImpact.gradeLetter,
      breakdown,
      hintImpact: finalHintImpact,
      feedback,
      detailedAnalysis: await this.generateDetailedAnalysis(conversation, medicalCase, finalHintImpact)
    }
  }

  private async generateBaseGrade(
    conversation: Conversation,
    medicalCase: MedicalCase
  ): Promise<number> {
    const conversationText = conversation.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    try {
      const text = await runNewGemini(
        BEST_GEMINI_MODEL,
        `You are an expert medical educator evaluating a student's performance in a clinical case simulation. You will grade the student's clinical reasoning, questioning skills, and diagnostic process.

Patient Case: ${medicalCase.disease}
Case Details: ${medicalCase.description}
Patient Profile: ${medicalCase.patientProfile.name}, ${medicalCase.patientProfile.age}-year-old ${medicalCase.patientProfile.gender}

Evaluate the student's performance based on:
1. Quality of questions asked
2. Clinical reasoning and diagnostic thinking
3. Systematic approach to patient interview
4. Appropriate follow-up questions
5. Recognition of key symptoms and signs
6. Communication skills
7. Efficiency in reaching diagnosis

Grade on a scale of 0-100 where:
- 90-100: Excellent clinical reasoning, systematic approach, excellent questions
- 80-89: Good clinical reasoning, mostly systematic, good questions
- 70-79: Satisfactory reasoning, some systematic approach, adequate questions
- 60-69: Basic reasoning, limited systematic approach, basic questions
- Below 60: Poor reasoning, no systematic approach, inadequate questions

Respond with ONLY a number between 0-100 representing the base grade.`,
        `Grade this student's performance in the clinical case simulation:

Conversation:
${conversationText}

Provide a base grade (0-100) for the student's clinical performance.`
      )

      const grade = parseInt(text.trim())
      return Math.max(0, Math.min(100, isNaN(grade) ? 75 : grade))
    } catch (error) {
      console.error("Error generating base grade:", error)
      throw error
    }
  }

  private async generateDetailedFeedback(
    conversation: Conversation,
    medicalCase: MedicalCase,
    hintImpact: HintGradeImpact
  ): Promise<PracticeSessionGrade["feedback"]> {
    const conversationText = conversation.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    try {
      const text = await runNewGemini(
        BEST_GEMINI_MODEL,
        `You are an expert medical educator providing detailed feedback on a student's clinical case performance. Consider both the clinical performance and AI hint usage.

Patient Case: ${medicalCase.disease}
Hint Usage: ${hintImpact.penaltyBreakdown.totalHints} hints used (${hintImpact.hintPenalty} point penalty)

Provide constructive feedback focusing on:
1. Clinical reasoning strengths and areas for improvement
2. Question quality and diagnostic approach
3. Impact of hint usage on learning and independence
4. Specific recommendations for improvement

Respond in this exact JSON format:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`,
        `Analyze this student's clinical case performance and provide detailed feedback:

Conversation:
${conversationText}

Hint Usage Analysis:
- Total hints used: ${hintImpact.penaltyBreakdown.totalHints}
- Grade penalty: ${hintImpact.hintPenalty} points
- Final grade: ${hintImpact.finalGrade}% (${hintImpact.gradeLetter})

Provide specific, actionable feedback for improvement.`
      )

      const cleanedText = text.trim()
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "")
      
      return JSON.parse(cleanedText)
    } catch (error) {
      console.error("Error generating detailed feedback:", error)
      throw error
    }
  }

  private async calculateBreakdownScores(
    conversation: Conversation,
    medicalCase: MedicalCase,
    hintImpact: HintGradeImpact
  ): Promise<PracticeSessionGrade["breakdown"]> {
    const studentMessages = conversation.messages.filter(m => m.role === "student")
    const totalQuestions = studentMessages.length
    
    // Base scores (will be adjusted by AI analysis)
    let conversationQuality = 80
    let clinicalReasoning = 80
    let questionEffectiveness = 80
    let diagnosticAccuracy = 80
    let communicationSkills = 80

    // Adjust based on hint usage (distribute across categories)
    const hintPenalty = hintImpact.hintPenalty / 5
    conversationQuality = Math.max(0, conversationQuality - hintPenalty)
    clinicalReasoning = Math.max(0, clinicalReasoning - hintPenalty * 1.5) // Higher penalty for clinical reasoning
    questionEffectiveness = Math.max(0, questionEffectiveness - hintPenalty * 0.8)
    diagnosticAccuracy = Math.max(0, diagnosticAccuracy - hintPenalty * 1.2)
    communicationSkills = Math.max(0, communicationSkills - hintPenalty * 0.5) // Lower penalty for communication

    // Adjust based on diagnosis correctness if available
    const latestDx = diagnosisService.getLatestConversationSubmission(conversation.id)
    if (latestDx) {
      if (latestDx.isCorrect) {
        diagnosticAccuracy = Math.min(100, diagnosticAccuracy + 8)
        clinicalReasoning = Math.min(100, clinicalReasoning + 3)
      } else {
        diagnosticAccuracy = Math.max(0, diagnosticAccuracy - 15)
        clinicalReasoning = Math.max(0, clinicalReasoning - 5)
      }
    }

    // Adjust based on conversation length and quality
    if (totalQuestions < 5) {
      questionEffectiveness -= 10
      clinicalReasoning -= 5
    } else if (totalQuestions > 15) {
      questionEffectiveness += 5 // Shows thoroughness
    }

    return {
      conversationQuality: Math.round(conversationQuality),
      clinicalReasoning: Math.round(clinicalReasoning),
      questionEffectiveness: Math.round(questionEffectiveness),
      diagnosticAccuracy: Math.round(diagnosticAccuracy),
      communicationSkills: Math.round(communicationSkills)
    }
  }

  private async generateDetailedAnalysis(
    conversation: Conversation,
    medicalCase: MedicalCase,
    hintImpact: HintGradeImpact
  ): Promise<PracticeSessionGrade["detailedAnalysis"]> {
    const conversationText = conversation.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    try {
      const text = await runNewGemini(
        BEST_GEMINI_MODEL,
        `You are an expert medical educator providing detailed analysis of a student's clinical case performance. Consider both clinical performance and AI hint usage impact.

Patient Case: ${medicalCase.disease}
Hint Usage: ${hintImpact.penaltyBreakdown.totalHints} hints used

Provide detailed analysis in this exact JSON format:
{
  "questionQuality": "Detailed analysis of question quality and appropriateness",
  "clinicalReasoning": "Analysis of clinical reasoning and diagnostic thinking",
  "diagnosticProcess": "Evaluation of diagnostic approach and systematic thinking",
  "communication": "Assessment of communication skills and patient interaction"
}`,
        `Provide detailed analysis of this student's clinical case performance:

Conversation:
${conversationText}

Hint Usage: ${hintImpact.penaltyBreakdown.totalHints} hints used (${hintImpact.hintPenalty} point penalty)

Analyze each aspect of the student's performance in detail.`
      )

      const cleanedText = text.trim()
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "")
      
      return JSON.parse(cleanedText)
    } catch (error) {
      console.error("Error generating detailed analysis:", error)
      throw error
    }
  }

  // End session and calculate final grade
  endSession(sessionId: string): HintGradeImpact | null {
    const session = aiHintTrackingService.endSession(sessionId)
    if (!session) return null

    // Calculate final grade (base grade would be calculated from conversation analysis)
    return aiHintTrackingService.calculateFinalGrade(85, sessionId) // Default base grade
  }
}

export const practiceGradingService = new PracticeGradingService()


