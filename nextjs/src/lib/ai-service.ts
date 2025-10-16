import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { ConversationContext } from "./data-models"

export interface AIResponse {
  content: string
  confidence: number
  shouldIntervene?: boolean
  interventionReason?: string
}

export interface ConversationGrading {
  overallGrade: number
  questionQualityGrade: number
  clinicalReasoningGrade: number
  communicationGrade: number
  efficiencyGrade: number
  feedback: {
    questionQuality: string[]
    clinicalReasoning: string[]
    communication: string[]
    efficiency: string[]
    overall: string[]
  }
  strengths: string[]
  improvements: string[]
  missedOpportunities: string[]
  excellentQuestions: string[]
  poorQuestions: string[]
  clinicalInsights: string
  recommendations: string[]
}

class AIService {
  private checkAPIKey(): void {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key is missing. Please add OPENAI_API_KEY to your environment variables in Project Settings.",
      )
    }
  }

  async generatePatientResponse(studentQuestion: string, context: ConversationContext): Promise<AIResponse> {
    this.checkAPIKey()

    const { disease, symptoms, patientProfile, conversationHistory } = context

    // Build conversation history for context
    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
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

Previous conversation:
${conversationContext}`,
        prompt: `The medical student asks: "${studentQuestion}"

Respond as the patient with ${disease}. You know your exact condition and all associated information. Be realistic, descriptive, and stay in character. Answer consistently with your condition.`,
      })

      return {
        content: text,
        confidence: 0.9,
      }
    } catch (error) {
      console.error("Error generating patient response:", error)
      if (error instanceof Error && error.message.includes("API key")) {
        return {
          content: "Please add your OpenAI API key in Project Settings to enable AI patient responses.",
          confidence: 0.1,
        }
      }
      // Fallback to a generic response if AI fails
      return {
        content: "I'm not feeling well, doctor. Could you ask me something specific about my symptoms?",
        confidence: 0.5,
      }
    }
  }

  async evaluateStudentQuestion(studentQuestion: string, context: ConversationContext): Promise<AIResponse> {
    this.checkAPIKey()

    const { disease, conversationHistory } = context

    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an experienced medical supervisor evaluating a medical student's question. 

IMPORTANT: You do NOT know the patient's diagnosis. You are evaluating the student's clinical reasoning and questioning approach based on the conversation so far.

Your job is to determine if the student's question is:
1. Relevant to gathering diagnostic information
2. Appropriate for the clinical context
3. Helping to narrow down differential diagnoses
4. Following logical interview flow

Respond with either:
- "APPROPRIATE: [brief positive feedback]" if the question is good
- "INTERVENE: [specific reason why the question is inappropriate or irrelevant]" if you need to intervene

Focus on the student's clinical reasoning process, not on whether they're asking about the "correct" diagnosis. Students should be investigating and forming hypotheses.

Previous conversation:
${conversationContext}`,
        prompt: `Evaluate this student question: "${studentQuestion}"

Is this question appropriate for gathering diagnostic information and demonstrating clinical reasoning?`,
      })

      const shouldIntervene = text.startsWith("INTERVENE:")
      const content = text.replace(/^(APPROPRIATE:|INTERVENE:)\s*/, "")

      return {
        content,
        confidence: 0.9,
        shouldIntervene,
        interventionReason: shouldIntervene ? content : undefined,
      }
    } catch (error) {
      console.error("Error evaluating student question:", error)
      if (error instanceof Error && error.message.includes("API key")) {
        return {
          content: "Please add your OpenAI API key in Project Settings to enable AI supervision.",
          confidence: 0.1,
          shouldIntervene: true,
          interventionReason: "API key required for AI evaluation",
        }
      }
      // Fallback to basic evaluation
      const lowerQuestion = studentQuestion.toLowerCase()
      const irrelevantPatterns = ["weather", "sports", "politics", "favorite color", "hobbies"]
      const isIrrelevant = irrelevantPatterns.some((pattern) => lowerQuestion.includes(pattern))

      if (isIrrelevant) {
        return {
          content:
            "That question is not relevant to the medical consultation. Please focus on the patient's symptoms and medical history.",
          confidence: 0.8,
          shouldIntervene: true,
          interventionReason: "Question not relevant to medical assessment",
        }
      }

      return {
        content: "Continue with your assessment.",
        confidence: 0.7,
        shouldIntervene: false,
      }
    }
  }

  async evaluateDoctorQuestion(doctorQuestion: string, context: ConversationContext): Promise<AIResponse> {
    this.checkAPIKey()

    const { disease, conversationHistory } = context

    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an experienced medical supervisor monitoring an AI doctor's questions in a shadow mode learning session. 

IMPORTANT: You do NOT know the patient's diagnosis. You are evaluating the AI doctor's clinical reasoning and questioning approach based on the conversation so far.

Your job is to determine if the AI doctor's question is:
1. Relevant to gathering diagnostic information
2. Appropriate for the clinical context
3. Helping to narrow down differential diagnoses
4. Following logical interview flow
5. Demonstrating good clinical practice

Respond with either:
- "APPROPRIATE: [brief positive feedback]" if the question is good
- "INTERVENE: [specific reason why the question is inappropriate, irrelevant, or demonstrates poor clinical practice]" if you need to intervene

Focus on the AI doctor's clinical reasoning process and whether it's following proper medical interview techniques.

Previous conversation:
${conversationContext}`,
        prompt: `Evaluate this AI doctor question: "${doctorQuestion}"

Is this question appropriate for gathering diagnostic information and demonstrating good clinical practice?`,
      })

      const shouldIntervene = text.startsWith("INTERVENE:")
      const content = text.replace(/^(APPROPRIATE:|INTERVENE:)\s*/, "")

      return {
        content,
        confidence: 0.9,
        shouldIntervene,
        interventionReason: shouldIntervene ? content : undefined,
      }
    } catch (error) {
      console.error("Error evaluating doctor question:", error)
      if (error instanceof Error && error.message.includes("API key")) {
        return {
          content: "Please add your OpenAI API key in Project Settings to enable AI supervision.",
          confidence: 0.1,
          shouldIntervene: true,
          interventionReason: "API key required for AI evaluation",
        }
      }
      // Fallback to basic evaluation
      const lowerQuestion = doctorQuestion.toLowerCase()
      const inappropriatePatterns = ["what's your favorite", "do you like", "unrelated", "personal"]
      const isInappropriate = inappropriatePatterns.some((pattern) => lowerQuestion.includes(pattern))

      if (isInappropriate) {
        return {
          content:
            "That question is not appropriate for a medical consultation. Please focus on the patient's symptoms and medical history.",
          confidence: 0.8,
          shouldIntervene: true,
          interventionReason: "Question not appropriate for medical assessment",
        }
      }

      return {
        content: "Continue with your assessment.",
        confidence: 0.7,
        shouldIntervene: false,
      }
    }
  }

  async gradeConversation(conversation: any, medicalCase: any): Promise<ConversationGrading> {
    this.checkAPIKey()

    const { disease, symptoms, patientProfile } = medicalCase
    const conversationContext = conversation.messages.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")

    // Validate that there's meaningful conversation content
    const studentMessages = conversation.messages.filter((msg: any) => msg.role === 'student')
    const patientMessages = conversation.messages.filter((msg: any) => msg.role === 'patient')
    
    // Check if there are actual questions asked by the student
    const hasStudentQuestions = studentMessages.length > 0 && 
      studentMessages.some((msg: any) => msg.content.trim().length > 10)
    
    // Check if there are patient responses
    const hasPatientResponses = patientMessages.length > 0 && 
      patientMessages.some((msg: any) => msg.content.trim().length > 10)
    
    // If no meaningful conversation, return appropriate grades
    if (!hasStudentQuestions || !hasPatientResponses || conversationContext.trim().length < 50) {
      return {
        overallGrade: 0,
        questionQualityGrade: 0,
        clinicalReasoningGrade: 0,
        communicationGrade: 0,
        efficiencyGrade: 0,
        feedback: {
          questionQuality: ["No questions were asked during the conversation"],
          clinicalReasoning: ["No clinical reasoning demonstrated - no questions were asked"],
          communication: ["No communication with patient occurred"],
          efficiency: ["No conversation took place"],
          overall: ["No meaningful conversation occurred - cannot evaluate performance"]
        },
        strengths: [],
        improvements: [
          "Start the conversation by introducing yourself to the patient",
          "Ask about the patient's chief complaint",
          "Gather relevant medical history",
          "Ask follow-up questions about symptoms"
        ],
        missedOpportunities: [
          "Did not establish rapport with patient",
          "Did not gather any medical history",
          "Did not assess current symptoms",
          "Did not demonstrate clinical reasoning"
        ],
        excellentQuestions: [],
        poorQuestions: [],
        clinicalInsights: "No clinical insights demonstrated - no conversation occurred",
        recommendations: [
          "Begin by introducing yourself and explaining your role",
          "Ask open-ended questions about the patient's concerns",
          "Follow up with specific questions about symptoms",
          "Demonstrate active listening and empathy"
        ]
      }
    }

    try {
      // Analyze the actual conversation content - NO AI GENERATION, ONLY REAL DATA
      const studentQuestions = conversation.messages
        .filter((msg: any) => msg.role === 'student')
        .map((msg: any) => msg.content.trim())
        .filter((content: string) => content.length > 0)

      const patientResponses = conversation.messages
        .filter((msg: any) => msg.role === 'patient')
        .map((msg: any) => msg.content.trim())
        .filter((content: string) => content.length > 0)

      // Count actual questions and responses
      const questionCount = studentQuestions.length
      const responseCount = patientResponses.length

      // Calculate grades based on ACTUAL conversation metrics
      let questionQualityGrade = 0
      let clinicalReasoningGrade = 0
      let communicationGrade = 0
      let efficiencyGrade = 0

      // Question Quality: Based on number of actual questions asked
      if (questionCount === 0) {
        questionQualityGrade = 0
      } else if (questionCount === 1) {
        questionQualityGrade = 25 // Only one question
      } else if (questionCount <= 3) {
        questionQualityGrade = 40 // Few questions
      } else if (questionCount <= 5) {
        questionQualityGrade = 60 // Some questions
      } else if (questionCount <= 8) {
        questionQualityGrade = 75 // Good number of questions
      } else {
        questionQualityGrade = 85 // Many questions
      }

      // Clinical Reasoning: Based on depth of actual questioning
      if (questionCount === 0) {
        clinicalReasoningGrade = 0
      } else if (questionCount <= 2) {
        clinicalReasoningGrade = 30 // Very limited
      } else if (questionCount <= 4) {
        clinicalReasoningGrade = 50 // Basic
      } else if (questionCount <= 6) {
        clinicalReasoningGrade = 70 // Good
      } else {
        clinicalReasoningGrade = 80 // Strong
      }

      // Communication: Based on actual interaction
      if (questionCount === 0 || responseCount === 0) {
        communicationGrade = 0
      } else if (questionCount <= 2) {
        communicationGrade = 40 // Limited
      } else if (questionCount <= 4) {
        communicationGrade = 60 // Basic
      } else if (questionCount <= 6) {
        communicationGrade = 75 // Good
      } else {
        communicationGrade = 85 // Strong
      }

      // Efficiency: Based on actual conversation flow
      if (questionCount === 0) {
        efficiencyGrade = 0
      } else if (questionCount <= 2) {
        efficiencyGrade = 35 // Very inefficient
      } else if (questionCount <= 4) {
        efficiencyGrade = 55 // Somewhat inefficient
      } else if (questionCount <= 6) {
        efficiencyGrade = 70 // Reasonably efficient
      } else {
        efficiencyGrade = 80 // Efficient
      }

      const overallGrade = Math.round((questionQualityGrade + clinicalReasoningGrade + communicationGrade + efficiencyGrade) / 4)

      // Generate feedback based on ACTUAL conversation content - NO FAKE DATA
      const feedback = {
        questionQuality: questionCount === 0 
          ? ["No questions were asked during the conversation"]
          : questionCount === 1
          ? [`Only asked one question: "${studentQuestions[0]}"`, "Need to ask more comprehensive questions", "Consider asking about symptoms, history, and associated factors"]
          : questionCount <= 3
          ? ["Asked limited questions", "Should explore more aspects of the patient's condition", "Consider asking about associated symptoms and history"]
          : ["Good questioning approach", "Covered multiple aspects of the condition", "Could explore differential diagnoses more"],
        
        clinicalReasoning: questionCount === 0
          ? ["No clinical reasoning demonstrated - no questions asked"]
          : questionCount <= 2
          ? ["Limited clinical reasoning shown", "Should consider differential diagnoses", "Need to explore symptoms more systematically"]
          : questionCount <= 4
          ? ["Basic clinical reasoning demonstrated", "Could improve systematic approach", "Consider exploring associated symptoms"]
          : ["Good clinical reasoning", "Systematic approach to questioning", "Could enhance differential thinking"],
        
        communication: questionCount === 0
          ? ["No communication with patient occurred"]
          : questionCount <= 2
          ? ["Limited communication", "Should engage more with patient", "Consider building better rapport"]
          : questionCount <= 4
          ? ["Basic communication skills", "Could improve patient engagement", "Consider more empathetic responses"]
          : ["Good communication skills", "Effective patient interaction", "Maintained professional demeanor"],
        
        efficiency: questionCount === 0
          ? ["No conversation took place"]
          : questionCount <= 2
          ? ["Very limited information gathering", "Should ask more comprehensive questions", "Need to be more systematic"]
          : questionCount <= 4
          ? ["Basic information gathering", "Could be more thorough", "Consider asking follow-up questions"]
          : ["Good information gathering", "Systematic approach", "Could enhance efficiency with better organization"],
        
        overall: questionCount === 0
          ? ["No meaningful conversation occurred", "Cannot evaluate performance without interaction", "Must engage with patient first"]
          : questionCount === 1
          ? ["Very limited conversation", "Only one question asked", "Need to conduct proper patient interview"]
          : questionCount <= 3
          ? ["Minimal conversation", "Limited questioning", "Should ask more comprehensive questions"]
          : ["Good conversation", "Adequate questioning", "Could improve depth and breadth"]
      }

      const strengths = questionCount === 0 
        ? []
        : questionCount === 1
        ? [`Asked one specific question: "${studentQuestions[0]}"`]
        : questionCount <= 3
        ? ["Asked some relevant questions", "Demonstrated basic communication"]
        : ["Asked multiple relevant questions", "Showed systematic approach", "Demonstrated good communication"]

      const improvements = questionCount === 0
        ? [
            "Start by introducing yourself to the patient",
            "Ask about the patient's chief complaint",
            "Gather relevant medical history",
            "Ask follow-up questions about symptoms"
          ]
        : questionCount === 1
        ? [
            "Ask more questions about the patient's condition",
            "Explore associated symptoms",
            "Gather medical history",
            "Consider differential diagnoses"
          ]
        : [
            "Ask more comprehensive questions",
            "Explore differential diagnoses",
            "Gather complete medical history",
            "Consider associated symptoms"
          ]

      const missedOpportunities = questionCount === 0
        ? [
            "Did not establish rapport with patient",
            "Did not gather any medical history",
            "Did not assess current symptoms",
            "Did not demonstrate clinical reasoning"
          ]
        : questionCount === 1
        ? [
            "Missed asking about associated symptoms",
            "Did not gather medical history",
            "Did not explore differential diagnoses",
            "Limited symptom assessment"
          ]
        : [
            "Could have asked about associated symptoms",
            "Missed some aspects of medical history",
            "Could explore differential diagnoses more",
            "Limited comprehensive assessment"
          ]

      const excellentQuestions = studentQuestions.filter((q: string) => q.length > 20) // Questions with some depth
      const poorQuestions = studentQuestions.filter((q: string) => q.length <= 10) // Very short questions

      const clinicalInsights = questionCount === 0
        ? "No clinical insights demonstrated - no conversation occurred"
        : questionCount === 1
        ? "Very limited clinical insight - only one question asked"
        : questionCount <= 3
        ? "Basic clinical insight demonstrated - limited questioning"
        : "Good clinical insight - systematic questioning approach"

      const recommendations = questionCount === 0
        ? [
            "Begin by introducing yourself and explaining your role",
            "Ask open-ended questions about the patient's concerns",
            "Follow up with specific questions about symptoms",
            "Demonstrate active listening and empathy"
          ]
        : questionCount === 1
        ? [
            "Ask follow-up questions to the initial question",
            "Explore associated symptoms and history",
            "Consider differential diagnoses",
            "Gather comprehensive patient information"
          ]
        : [
            "Continue building on current questioning approach",
            "Explore differential diagnoses",
            "Gather complete medical history",
            "Consider associated symptoms and risk factors"
          ]

      return {
        overallGrade,
        questionQualityGrade,
        clinicalReasoningGrade,
        communicationGrade,
        efficiencyGrade,
        feedback,
        strengths,
        improvements,
        missedOpportunities,
        excellentQuestions,
        poorQuestions,
        clinicalInsights,
        recommendations
      }
    } catch (error) {
      console.error("Error grading conversation:", error)
      
      // Fallback grading
      return {
        overallGrade: 70,
        questionQualityGrade: 70,
        clinicalReasoningGrade: 70,
        communicationGrade: 70,
        efficiencyGrade: 70,
        feedback: {
          questionQuality: ["Unable to evaluate question quality due to technical issues"],
          clinicalReasoning: ["Unable to evaluate clinical reasoning due to technical issues"],
          communication: ["Unable to evaluate communication due to technical issues"],
          efficiency: ["Unable to evaluate efficiency due to technical issues"],
          overall: ["Technical issues prevented full evaluation"]
        },
        strengths: ["Student engaged in clinical interview"],
        improvements: ["Complete evaluation unavailable due to technical issues"],
        missedOpportunities: ["Unable to assess missed opportunities"],
        excellentQuestions: [],
        poorQuestions: [],
        clinicalInsights: "Unable to assess clinical insights due to technical issues",
        recommendations: ["Retry evaluation when technical issues are resolved"]
      }
    }
  }
}

export const aiService = new AIService()
