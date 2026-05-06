
"use client"

import { Suspense, useState, useEffect } from "react"
import { sampleCases } from "@/lib/fyp/data-models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, Brain, User, BarChart3, Lightbulb, Mic, Send, Settings, AlertTriangle, Heart, Stethoscope, BookOpen, Target, Clock, TrendingUp, Home, FileText, Activity, Thermometer, Calendar, Users, Briefcase, MessageCircle, ArrowLeft, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import Link from "next/link"
import { useRouter } from "next/router"

const AVAILABLE_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Fast Gemini model", provider: "gemini" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Low latency Gemini", provider: "gemini" },
]

const GRADING_MODEL = "gemini-2.5-flash"

const getModelProvider = (model: string) => {
  const modelInfo = AVAILABLE_MODELS.find((m) => m.id === model)
  return modelInfo?.provider || "gemini"
}

async function callGeminiAPI(model: string, messages: any[], maxTokens = 256, temperature = 0.7) {
  const response = await fetch("/api/evaluation/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      maxTokens,
      temperature,
    }),
  })

  const rawText = await response.text()
  let payload: any = null

  try {
    payload = rawText ? JSON.parse(rawText) : null
  } catch {
    throw new Error(`Evaluation generation returned invalid JSON (${response.status})`)
  }

  if (!response.ok) {
    const details = payload?.details || payload?.error || rawText
    throw new Error(`Evaluation generation failed (${response.status}): ${details}`)
  }

  const text = payload?.text
  if (!text || typeof text !== "string") {
    throw new Error("Evaluation generation returned empty text.")
  }

  return text
}

async function getAIPatientResponse(studentQuestion: string, context: any, model: string) {
  console.log("[v0] Getting patient response with model:", model)
  console.log("[v0] Student question:", studentQuestion)

  // Use actualDisease for the AI patient (they know the real condition)
  const patientDisease = context.actualDisease || context.disease

  const messages = [
    {
      role: "system",
      content: `You are a patient with ${patientDisease}. Your profile:
- Name: ${context.patientProfile.name}
- Age: ${context.patientProfile.age}
- Gender: ${context.patientProfile.gender}
- Occupation: ${context.patientProfile.occupation}
- Current symptoms: ${context.symptoms?.join(", ")}

Respond naturally and realistically as this patient.

Rules:
- Give a complete, coherent response in 1-3 sentences.
- Address the doctor's latest question directly first, then add one relevant symptom/detail.
- Never repeat the doctor's words verbatim as your full response.
- Do not output fragments, unfinished sentences, or quoted text.
- Stay in patient voice; do not use labels like "Patient:" or meta commentary.
- Do not mention the disease name unless asked directly, and even then answer as a patient would.`,
    },
    {
      role: "user",
      content: `The student asks: "${studentQuestion}"

Respond as the patient with ${patientDisease}.`,
    },
  ]

  const provider = getModelProvider(model)
  console.log("[v0] Using provider:", provider)

  if (provider !== "gemini") {
    throw new Error(`Unsupported model provider: ${provider}`)
  }

  const result = await callGeminiAPI(model, messages, 256, 0.7)
  console.log("[v0] Patient response result:", result)
  return result
}

async function getAIStudentQuestion(conversation: string, context: any, model: string) {
  const messages = [
    {
      role: "system",
      content: `You are an AI medical student interviewing a patient.
Ask exactly one complete, natural clinical question that helps diagnosis.

Rules:
- Output only one question.
- The question must be a complete sentence ending with "?".
- Keep it specific (12-24 words), clinically focused, and non-generic.
- Do not include quotes, labels, explanations, or multiple questions.`,
    },
    {
      role: "user",
      content: `Conversation so far:
${conversation}
What is the next best question to ask the patient?`,
    },
  ]

  const provider = getModelProvider(model)

  if (provider !== "gemini") {
    throw new Error(`Unsupported model provider: ${provider}`)
  }
  return (await callGeminiAPI(model, messages, 96, 0.25))
    .replace(/^["'`\s]+|["'`\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

async function getEvaluation(
  conversation: { role: string; content: string; timestamp: string }[],
  differentialDiagnosis: string,
  context: any,
) {
  const convoText = conversation.map((m) => `${m.role}: ${m.content}`).join("\n")
  const text = await callGeminiAPI(
    GRADING_MODEL,
    [
      {
        role: "system",
        content: `You are an expert clinical educator. Evaluate the following conversation between a student and an AI patient. 
Grade the student's performance, point out any weak or irrelevant questions, and suggest improvements.
Also, evaluate the student's differential diagnosis and provide feedback.

Respond in this format:
GRADE: [A-F]
SCORE: [0-100]
FEEDBACK: [overall feedback]
QUESTION_QUALITY: [assessment of questions asked]
DIAGNOSTIC_REASONING: [evaluation of diagnostic approach]
IMPROVEMENT_SUGGESTIONS: [list of suggestions]
DIFFERENTIAL_DIAGNOSIS_FEEDBACK: [feedback on differential diagnosis]
MISSED_OPPORTUNITIES: [important questions not asked]`,
      },
      {
        role: "user",
        content: `Patient Case: ${context.disease}
Conversation:
${convoText}

Student's Differential Diagnosis:
${differentialDiagnosis}`,
      },
    ],
    800,
    0.7,
  )

  const parseSection = (label: string) => {
    const regex = new RegExp(`${label}:([\\s\\S]*?)(?=^[A-Z_]+:|$)`, "m")
    const match = text.match(regex)
    return match ? match[1].trim() : ""
  }

  return {
    grade: parseSection("GRADE"),
    score: parseSection("SCORE"),
    feedback: parseSection("FEEDBACK"),
    questionQuality: parseSection("QUESTION_QUALITY"),
    diagnosticReasoning: parseSection("DIAGNOSTIC_REASONING"),
    improvementSuggestions: parseSection("IMPROVEMENT_SUGGESTIONS").split("\n").filter(Boolean),
    differentialDiagnosisFeedback: parseSection("DIFFERENTIAL_DIAGNOSIS_FEEDBACK"),
    missedOpportunities: parseSection("MISSED_OPPORTUNITIES"),
    raw: text,
  }
}

async function getDifferentialDiagnosisHelp(context: any, conversation: any[], model: string) {
  const convoText = conversation.map((m) => `${m.role}: ${m.content}`).join("\n")

  const messages = [
    {
      role: "system",
      content: `You are an expert medical educator helping a student with diagnostic reasoning. Based on the patient conversation, provide specific differential diagnoses, clinical reasoning, and suggested next questions.

You must respond in exactly this format:

DIFFERENTIAL_DIAGNOSES:
- [List 3-5 specific possible diagnoses based on the symptoms mentioned]
- [Include both common and serious conditions to consider]
- [Be specific, not generic]

REASONING:
[Provide detailed clinical reasoning for each differential diagnosis based on the specific symptoms and patient history mentioned in the conversation. Explain why each condition should be considered.]

NEXT_QUESTIONS:
- [List 5-7 specific questions that would help narrow down the diagnosis]
- [Focus on questions that would differentiate between the proposed diagnoses]
- [Include questions about timing, associated symptoms, risk factors, etc.]

Be specific and relevant to the actual conversation content. Do not provide generic medical advice.`,
    },
    {
      role: "user",
      content: `Patient Case Context:
Disease: ${context.disease || "Unknown"}
Patient: ${context.patientProfile?.name || "Unknown"}, ${context.patientProfile?.age || "Unknown"} years old, ${context.patientProfile?.gender || "Unknown"}
Known Symptoms: ${context.symptoms?.join(", ") || "None specified"}

Conversation so far:
${convoText}

Based on this specific conversation and patient presentation, provide differential diagnoses, reasoning, and suggested next questions.`,
    },
  ]

  const provider = getModelProvider(model)
  let text = ""

  if (provider !== "gemini") {
    throw new Error(`Unsupported model provider: ${provider}`)
  }
  text = await callGeminiAPI(model, messages, 600, 0.3)

  const parseSection = (label: string) => {
    const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=^[A-Z_]+:|$)`, "m")
    const match = text.match(regex)
    return match ? match[1].trim() : ""
  }

  let differentialDiagnoses = parseSection("DIFFERENTIAL_DIAGNOSES")
  let reasoning = parseSection("REASONING")
  let nextQuestions = parseSection("NEXT_QUESTIONS")

  if (!differentialDiagnoses && !reasoning && !nextQuestions) {
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length > 0) {
      reasoning = text
      differentialDiagnoses =
        "Based on the conversation, please review the clinical reasoning below for diagnostic considerations."
      nextQuestions = "Continue gathering patient history, review of systems, and consider physical examination findings to narrow the diagnosis."
    }
  }

  if (!differentialDiagnoses) {
    differentialDiagnoses =
      conversation.length === 0
        ? "Start a conversation with the patient to generate specific differential diagnoses."
        : "Unable to generate specific differential diagnoses. Please try again or continue the conversation."
  }

  if (!reasoning) {
    reasoning =
      conversation.length === 0
        ? "Clinical reasoning will be provided once you begin interviewing the patient."
        : "Unable to generate specific clinical reasoning. Please try again or provide more patient information."
  }

  if (!nextQuestions) {
    nextQuestions =
      conversation.length === 0
        ? "Begin by asking about the patient's chief complaint and history of present illness."
        : "Continue gathering patient history, review of systems, and consider physical examination."
  }

  return {
    differentialDiagnoses,
    reasoning,
    nextQuestions,
    rawResponse: text,
  }
}

// New function for real-time clinical reasoning
async function getClinicalReasoning(context: any, conversation: any[], model: string) {
  const convoText = conversation.map((m) => `${m.role}: ${m.content}`).join("\n")

  const messages = [
    {
      role: "system",
      content: `You are an expert clinical educator providing real-time clinical reasoning analysis. Based on the patient conversation, provide:

1. Current clinical assessment
2. Red flags or concerning symptoms
3. EXACTLY 3 SPECIFIC differential diagnoses with likelihood percentages
4. Next priority questions
5. Clinical reasoning process

CRITICAL REQUIREMENTS:
- You MUST provide exactly 3 SPECIFIC, MEANINGFUL differential diagnoses
- Each diagnosis must be a real medical condition, not generic placeholders
- Percentages should add up to approximately 100%
- Base percentages on current conversation evidence
- Consider both common and serious conditions that could cause the symptoms
- Analyze the ACTUAL conversation content to determine the most relevant differentials

DIFFERENTIAL DIAGNOSIS GUIDELINES:
- For chest pain: Consider MI, unstable angina, pulmonary embolism, aortic dissection, pericarditis, GERD, musculoskeletal pain, etc.
- For abdominal pain: Consider appendicitis, cholecystitis, pancreatitis, bowel obstruction, gastroenteritis, etc.
- For respiratory symptoms: Consider pneumonia, asthma, COPD, pulmonary embolism, bronchitis, etc.
- For neurological symptoms: Consider stroke, migraine, seizure, etc.
- For fever: Consider infection, sepsis, inflammatory conditions, etc.
- Always include the most likely diagnosis plus 2 other realistic possibilities based on the conversation

Respond in this exact format:

CLINICAL_ASSESSMENT:
[Brief assessment of current clinical picture based on conversation]

RED_FLAGS:
- [List any red flag symptoms or concerning findings]
- [Include urgency level and reasoning]

DIFFERENTIAL_DIAGNOSES:
1. [Specific Diagnosis 1] - [X%] - [Brief reasoning based on current evidence]
2. [Specific Diagnosis 2] - [Y%] - [Brief reasoning based on current evidence]
3. [Specific Diagnosis 3] - [Z%] - [Brief reasoning based on current evidence]

NEXT_PRIORITY_QUESTIONS:
1. [Question 1] | [Educational note explaining why this question should be asked]
2. [Question 2] | [Educational note explaining why this question should be asked]
3. [Question 3] | [Educational note explaining why this question should be asked]

CLINICAL_REASONING:
[Detailed explanation of the clinical reasoning process, what information is most important, and how to proceed]

IMPORTANT: 
- Never use generic terms like "Possible diagnosis" or "Further evaluation needed"
- Always provide 3 specific, real medical conditions
- Base your differentials on the ACTUAL conversation content, not generic templates
- If the conversation mentions specific symptoms, consider diagnoses that match those symptoms`,
    },
    {
      role: "user",
      content: `Patient Case: ${context.disease || "Unknown"}
Patient: ${context.patientProfile?.name || "Unknown"}, ${context.patientProfile?.age || "Unknown"} years old, ${context.patientProfile?.gender || "Unknown"}
Known Symptoms: ${context.symptoms?.join(", ") || "None specified"}

Conversation:
${convoText}

Provide real-time clinical reasoning analysis.`,
    },
  ]

  const provider = getModelProvider(model)
  let text = ""

  if (provider !== "gemini") {
    throw new Error(`Unsupported model provider: ${provider}`)
  }
  text = await callGeminiAPI(model, messages, 800, 0.3)

  const parseSection = (label: string) => {
    const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=^[A-Z_]+:|$)`, "m")
    const match = text.match(regex)
    return match ? match[1].trim() : ""
  }

  return {
    clinicalAssessment: parseSection("CLINICAL_ASSESSMENT") || "Initial assessment pending...",
    redFlags: parseSection("RED_FLAGS") || "No red flags identified yet.",
    differentialDiagnoses: parseSection("DIFFERENTIAL_DIAGNOSES") || "Differential diagnoses will appear as conversation progresses.",
    nextPriorityQuestions: parseSection("NEXT_PRIORITY_QUESTIONS") || "Start by asking about the chief complaint.",
    clinicalReasoning: parseSection("CLINICAL_REASONING") || "Clinical reasoning will develop as you gather more information.",
    rawResponse: text,
  }
}

// New function for learning insights
async function getLearningInsights(context: any, conversation: any[], model: string) {
  const convoText = conversation.map((m) => `${m.role}: ${m.content}`).join("\n")

  const messages = [
    {
      role: "system",
      content: `You are an expert medical educator providing real-time learning insights. Based on the patient conversation, provide:

1. Key learning points from the conversation
2. Clinical guidelines relevant to the case
3. Clinical pearls and important concepts
4. What the student should focus on next
5. Common pitfalls to avoid

Respond in this exact format:

KEY_POINTS:
- [Important learning point 1]
- [Important learning point 2]
- [Important learning point 3]

CLINICAL_GUIDELINES:
[Relevant clinical guidelines or protocols for this type of case]

CLINICAL_PEARLS:
[Important clinical pearls, mnemonics, or key concepts]

FOCUS_AREAS:
[What the student should focus on in the next part of the interview]

COMMON_PITFALLS:
- [Common mistake to avoid]
- [Another common pitfall]`,
    },
    {
      role: "user",
      content: `Patient Case: ${context.disease || "Unknown"}
Patient: ${context.patientProfile?.name || "Unknown"}, ${context.patientProfile?.age || "Unknown"} years old, ${context.patientProfile?.gender || "Unknown"}
Known Symptoms: ${context.symptoms?.join(", ") || "None specified"}

Conversation:
${convoText}

Provide educational insights and learning points.`,
    },
  ]

  const provider = getModelProvider(model)
  let text = ""

  if (provider !== "gemini") {
    throw new Error(`Unsupported model provider: ${provider}`)
  }
  text = await callGeminiAPI(model, messages, 600, 0.3)

  const parseSection = (label: string) => {
    const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=^[A-Z_]+:|$)`, "m")
    const match = text.match(regex)
    return match ? match[1].trim() : ""
  }

  return {
    keyPoints: parseSection("KEY_POINTS") || "Key learning points will appear as you progress through the case.",
    clinicalGuidelines: parseSection("CLINICAL_GUIDELINES") || "Clinical guidelines will be provided based on the case presentation.",
    clinicalPearls: parseSection("CLINICAL_PEARLS") || "Clinical pearls and important concepts will be highlighted as you learn.",
    focusAreas: parseSection("FOCUS_AREAS") || "Focus areas will be suggested based on your interview progress.",
    commonPitfalls: parseSection("COMMON_PITFALLS") || "Common pitfalls will be highlighted to help you avoid mistakes.",
    rawResponse: text,
  }
}

function EvaluationPageContent({
  initialCopilotMode = false,
  skipExternalRedirects = false,
  embedInAppShell = false,
}: {
  initialCopilotMode?: boolean
  skipExternalRedirects?: boolean
  embedInAppShell?: boolean
}) {
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash")
  const [specialty, setSpecialty] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [conversation, setConversation] = useState<{ role: string; content: string; timestamp: string }[]>([])
  const [studentInput, setStudentInput] = useState("")
  const [isPatientResponding, setIsPatientResponding] = useState(false)
  const [interactionError, setInteractionError] = useState<string | null>(null)
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState("")
  const [evaluation, setEvaluation] = useState<any>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  // Evaluation mode state
  const [isEvaluationMode, setIsEvaluationMode] = useState(false)
  const [showNurseReport, setShowNurseReport] = useState(false)
  const [nurseReportAnimated, setNurseReportAnimated] = useState(false)
  const [showCaseGenerationForm, setShowCaseGenerationForm] = useState(false)
  const [showCaseSelection, setShowCaseSelection] = useState(false)
  const [showEvaluationLanding, setShowEvaluationLanding] = useState(false)
  const [isGeneratingCase, setIsGeneratingCase] = useState(false)
  
  // Case generation form state
  const [caseFormData, setCaseFormData] = useState({
    specialty: "random",
    difficultyLevel: "intermediate",
    rareCase: false,
    caseType: "any"
  })

  const [copilotMode, setCopilotMode] = useState(initialCopilotMode)
  const [showHelpers, setShowHelpers] = useState(false)
  const [diagnosticHelp, setDiagnosticHelp] = useState<any>(null)
  const [isLoadingHelp, setIsLoadingHelp] = useState(false)
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([])

  // New state for real-time features
  const [clinicalReasoning, setClinicalReasoning] = useState<any>(null)
  const [learningInsights, setLearningInsights] = useState<any>(null)
  const [isUpdatingReasoning, setIsUpdatingReasoning] = useState(false)
  const [isUpdatingInsights, setIsUpdatingInsights] = useState(false)
  const [activeTab, setActiveTab] = useState("educational-content")
  const [structuredQuestions, setStructuredQuestions] = useState<Array<{question: string, note: string}>>([])
  const [differentialDiagnoses, setDifferentialDiagnoses] = useState<Array<{diagnosis: string, percentage: number, reasoning: string}>>([])
  const [conversationWithRoles, setConversationWithRoles] = useState<Array<{ role: string; content: string; timestamp: string; source?: string }>>([])
  
  // Student-Doctor chat state
  const [studentDoctorChat, setStudentDoctorChat] = useState<Array<{ role: string; content: string; timestamp: string }>>([])
  const [studentQuestion, setStudentQuestion] = useState("")
  const [isDoctorResponding, setIsDoctorResponding] = useState(false)
  const [isDoctorChatOpen, setIsDoctorChatOpen] = useState(false)
  const [isDoctorChatMinimized, setIsDoctorChatMinimized] = useState(false)
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Navigation state for Doctor Mind and Learning Insights
  const [cardHistory, setCardHistory] = useState<Array<{
    timestamp: string
    conversationLength: number
    clinicalReasoning: any
    learningInsights: any
    differentialDiagnoses: Array<{diagnosis: string, percentage: number, reasoning: string}>
    structuredQuestions: Array<{question: string, note: string}>
  }>>([])
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(-1)
  const [isNavigating, setIsNavigating] = useState(false)

  // Handle URL parameters for evaluation mode (FYP logic; Pages Router + optional MedPrep embed)
  useEffect(() => {
    if (!router.isReady) return

    const caseId = typeof router.query.caseId === "string" ? router.query.caseId : undefined
    const mode = typeof router.query.mode === "string" ? router.query.mode : undefined
    const generated = typeof router.query.generated === "string" ? router.query.generated : undefined

    console.log("Evaluation useEffect triggered:", { caseId, mode, generated, selectedCase: selectedCase?.id })

    if (mode === "evaluation" && isEvaluationMode && selectedCase && !showCaseSelection && !showCaseGenerationForm) {
      console.log("Already in evaluation mode with case selected, skipping useEffect")
      return
    }

    if (mode === "evaluation" && selectedCase && !generated) {
      console.log("Case already selected, not showing case selection")
      setShowCaseSelection(false)
      setShowCaseGenerationForm(false)
      return
    }

    if (
      mode === "evaluation" ||
      mode === "practice" ||
      mode === "learning" ||
      (!mode && !caseId && !generated)
    ) {
      console.log("Setting evaluation mode to true")
      setIsEvaluationMode(true)

      if (caseId) {
        setShowEvaluationLanding(false)
        const foundCase = sampleCases.find((c) => c.id === caseId)
        if (foundCase) {
          setSelectedCase(foundCase)
          setShowCaseSelection(false)
          setShowCaseGenerationForm(false)

          if (!skipExternalRedirects && mode === "practice") {
            window.location.href = `/case/${caseId}`
            return
          }
          if (!skipExternalRedirects && mode === "learning") {
            window.location.href = `/learn/${caseId}`
            return
          }

          setTimeout(() => setShowNurseReport(true), 1000)
        } else if (generated === "true") {
          const generatedCaseData = localStorage.getItem("generatedCase")
          console.log("Generated case data from localStorage:", generatedCaseData)
          if (generatedCaseData) {
            try {
              const generatedCase = JSON.parse(generatedCaseData)
              console.log("Setting generated case:", generatedCase)
              setSelectedCase(generatedCase)
              localStorage.removeItem("generatedCase")
              setShowCaseSelection(false)
              setShowCaseGenerationForm(false)

              if (!skipExternalRedirects && mode === "practice") {
                window.location.href = `/case/${generatedCase.id}`
                return
              }
              if (!skipExternalRedirects && mode === "learning") {
                window.location.href = `/learn/${generatedCase.id}`
                return
              }

              setTimeout(() => setShowNurseReport(true), 1000)
            } catch (error) {
              console.error("Error parsing generated case:", error)
              setShowCaseSelection(true)
            }
          } else {
            console.log("No generated case data in localStorage, showing case selection")
            setShowCaseSelection(true)
          }
        } else {
          setShowCaseSelection(true)
        }
      } else if (generated === "true") {
        setShowCaseGenerationForm(true)
      } else {
        console.log("Showing evaluation landing page")
        setShowEvaluationLanding(true)
      }
    }
  }, [
    router.isReady,
    router.query.caseId,
    router.query.mode,
    router.query.generated,
    skipExternalRedirects,
  ])

  // Function to generate a new case for evaluation mode
  const handleGenerateNewCase = async () => {
    setIsGeneratingCase(true)
    try {
      const response = await fetch("/api/cases/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count: 1,
          specialty: caseFormData.specialty === "random" ? "" : caseFormData.specialty,
          difficulty: caseFormData.difficultyLevel,
          forceRare: caseFormData.rareCase,
          rareProbability: caseFormData.rareCase ? 1.0 : 0.08,
          caseType: caseFormData.caseType === "any" ? "outpatient" : caseFormData.caseType,
          useLLM: true
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to generate case")
      }
      
      const data = await response.json()
      if (data.cases && data.cases.length > 0) {
        const generatedCase = data.cases[0]
        
        // Set the generated case and start evaluation interface directly
        setSelectedCase(generatedCase)
        setShowCaseGenerationForm(false)
        setShowCaseSelection(false)
        setShowEvaluationLanding(false)
        setShowNurseReport(false)
        
        // Set the active tab to educational-content
        setActiveTab("educational-content")
        
        // Trigger animation after a brief delay
        setTimeout(() => {
          setNurseReportAnimated(true)
        }, 100)
      }
    } catch (error) {
      console.error("Error generating case:", error)
      throw error
    } finally {
      setIsGeneratingCase(false)
    }
  }

  // Function to handle case selection
  const handleCaseSelection = (caseId: string) => {
    const foundCase = sampleCases.find(c => c.id === caseId)
    if (foundCase) {
      setSelectedCase(foundCase)
      setShowCaseSelection(false)
      setShowCaseGenerationForm(false)
      setShowEvaluationLanding(false)
      setShowNurseReport(false)
      
      // Set the active tab to educational-content
      setActiveTab("educational-content")
      
      // Trigger animation after a brief delay
      setTimeout(() => {
        setNurseReportAnimated(true)
      }, 100)
    }
  }

  // Function to navigate to case generation from landing page
  const handleNavigateToGenerate = () => {
    setShowEvaluationLanding(false)
    setShowCaseGenerationForm(true)
  }

  // Function to navigate to case selection from landing page
  const handleNavigateToSelect = () => {
    setShowEvaluationLanding(false)
    setShowCaseSelection(true)
  }

  // Function to start case from nurse report
  const handleStartCaseFromNurseReport = () => {
    console.log("Starting case from nurse report, selectedCase:", selectedCase?.id)
    console.log("Current state:", { 
      isEvaluationMode, 
      selectedCase: selectedCase?.id, 
      showNurseReport, 
      showCaseSelection, 
      showCaseGenerationForm 
    })
    setShowNurseReport(false)
    // Ensure case selection modals are hidden
    setShowCaseSelection(false)
    setShowCaseGenerationForm(false)
    // Set the active tab to educational-content in Learning Insights (first tab)
    setActiveTab("educational-content")
    // Trigger animation after a brief delay
    setTimeout(() => {
      setNurseReportAnimated(true)
    }, 100)
  }

  const filteredCases = sampleCases.filter(
    (c) => (!difficulty || c.difficulty === difficulty),
  )

  const getContext = () =>
    selectedCase
      ? {
          caseId: selectedCase.id,
          // In evaluation mode, hide the disease from student and AI doctor
          disease: isEvaluationMode ? "Unknown Condition" : selectedCase.disease,
          // But keep the actual disease for the AI patient
          actualDisease: selectedCase.disease,
          symptoms: selectedCase.symptoms,
          patientProfile: selectedCase.patientProfile,
          // Add case metadata for evaluation mode
          caseMetadata: isEvaluationMode ? {
            title: selectedCase.title,
            specialty: selectedCase.specialty,
            difficulty: selectedCase.difficulty,
            isRare: selectedCase.isRare,
            caseType: selectedCase.caseType || "outpatient"
          } : null
        }
      : {}

  // Function to handle clicking on suggested questions
  const handleQuestionClick = async (question: string) => {
    if (!selectedCase || isPatientResponding) return
    
    setConversation((prev) => [
      ...prev,
      { role: "student", content: question, timestamp: new Date().toISOString() },
    ])
    setConversationWithRoles((prev) => [
      ...prev,
      { role: "student", content: question, timestamp: new Date().toISOString(), source: "suggested" },
    ])
    setIsPatientResponding(true)
    const aiResponse = await getAIPatientResponse(question, getContext(), selectedModel)
    setConversation((prev) => [
      ...prev,
      { role: "patient", content: aiResponse, timestamp: new Date().toISOString() },
    ])
    setConversationWithRoles((prev) => [
      ...prev,
      { role: "patient", content: aiResponse, timestamp: new Date().toISOString() },
    ])
    setIsPatientResponding(false)
  }

  // Function to handle student questions to the doctor
  const handleStudentToDoctorQuestion = async () => {
    if (!studentQuestion.trim() || isDoctorResponding) return
    
    setInteractionError(null)
    setStudentDoctorChat((prev) => [
      ...prev,
      { role: "student", content: studentQuestion, timestamp: new Date().toISOString() },
    ])
    setIsDoctorResponding(true)
    
    // Get AI doctor response
    const messages = [
      {
        role: "system",
        content: `You are an expert medical educator and clinical supervisor. A medical student is asking you questions during a patient consultation. Provide BRIEF, concise responses (1-2 sentences) that guide their clinical reasoning without giving away the diagnosis directly. Be encouraging and educational but keep responses short.

Current patient case: ${selectedCase?.disease || "Unknown"}
Current conversation: ${conversation.map(m => `${m.role}: ${m.content}`).join("\n")}

Respond as a supportive clinical supervisor would, but keep it brief.`,
      },
      {
        role: "user",
        content: `Student asks: "${studentQuestion}"

Please provide guidance and educational feedback.`,
      },
    ]

    try {
      const provider = getModelProvider(selectedModel)
      if (provider !== "gemini") {
        throw new Error(`Unsupported model provider: ${provider}`)
      }

      const doctorResponse = await callGeminiAPI(selectedModel, messages, 150, 0.7)
      setStudentDoctorChat((prev) => [
        ...prev,
        { role: "doctor", content: doctorResponse, timestamp: new Date().toISOString() },
      ])
      setStudentQuestion("")
    } catch (error) {
      console.error("Failed to generate doctor guidance:", error)
      setInteractionError(error instanceof Error ? error.message : "Failed to generate doctor guidance.")
    } finally {
      setIsDoctorResponding(false)
    }
  }

  // Functions for doctor chat dragging
  const handleChatMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.chat-header')) {
      setIsDragging(true)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleChatMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setChatPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleChatMouseUp = () => {
    setIsDragging(false)
  }

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleChatMouseMove)
      document.addEventListener('mouseup', handleChatMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleChatMouseMove)
        document.removeEventListener('mouseup', handleChatMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // Function to save current card state to history
  const saveCardState = () => {
    if (clinicalReasoning || learningInsights) {
      console.log("Saving card state:", {
        clinicalReasoning: clinicalReasoning ? "exists" : "null",
        learningInsights: learningInsights ? "exists" : "null",
        conversationLength: conversationWithRoles.length
      })
      const currentState = {
        timestamp: new Date().toISOString(),
        conversationLength: conversationWithRoles.length,
        clinicalReasoning: clinicalReasoning,
        learningInsights: learningInsights,
        differentialDiagnoses: [...differentialDiagnoses],
        structuredQuestions: [...structuredQuestions]
      }
      setCardHistory(prev => [...prev, currentState])
      setCurrentCardIndex(cardHistory.length) // Set to the new index
    }
  }

  // Function to navigate to previous card state
  const goToPreviousCard = () => {
    if (currentCardIndex > 0) {
      setIsNavigating(true)
      const newIndex = currentCardIndex - 1
      const historyItem = cardHistory[newIndex]
      console.log("Navigating to previous card:", {
        fromIndex: currentCardIndex,
        toIndex: newIndex,
        historyItem: historyItem ? "exists" : "null",
        learningInsights: historyItem?.learningInsights ? "exists" : "null"
      })
      
      if (historyItem) {
        setClinicalReasoning(historyItem.clinicalReasoning)
        setLearningInsights(historyItem.learningInsights)
        setDifferentialDiagnoses(historyItem.differentialDiagnoses)
        setStructuredQuestions(historyItem.structuredQuestions)
        setCurrentCardIndex(newIndex)
        
        // Highlight the conversation up to that point
        setTimeout(() => setIsNavigating(false), 500)
      }
    }
  }

  // Function to navigate to next card state
  const goToNextCard = () => {
    if (currentCardIndex < cardHistory.length - 1) {
      setIsNavigating(true)
      const newIndex = currentCardIndex + 1
      const historyItem = cardHistory[newIndex]
      
      if (historyItem) {
        setClinicalReasoning(historyItem.clinicalReasoning)
        setLearningInsights(historyItem.learningInsights)
        setDifferentialDiagnoses(historyItem.differentialDiagnoses)
        setStructuredQuestions(historyItem.structuredQuestions)
        setCurrentCardIndex(newIndex)
        
        // Highlight the conversation up to that point
        setTimeout(() => setIsNavigating(false), 500)
      }
    } else if (currentCardIndex === cardHistory.length - 1) {
      // Go back to current state
      setIsNavigating(true)
      setCurrentCardIndex(-1) // -1 means current state
      setTimeout(() => setIsNavigating(false), 500)
    }
  }

  // Real-time updates for clinical reasoning and learning insights
  useEffect(() => {
    const updateRealTimeInsights = async () => {
      if (!selectedCase || conversation.length === 0 || isNavigating) return

      const context = getContext()
      
      // Update clinical reasoning
      setIsUpdatingReasoning(true)
      try {
        const reasoning = await getClinicalReasoning(context, conversation, selectedModel)
        setClinicalReasoning(reasoning)
        
        // Parse structured questions
        if (reasoning.nextPriorityQuestions) {
          const questions: Array<{question: string, note: string}> = []
          const lines = reasoning.nextPriorityQuestions.split('\n')
          
          for (const line of lines) {
            if (line.trim() && line.match(/^\d+\./)) {
              const parts = line.split('|')
              if (parts.length === 2) {
                const questionPart = parts[0].replace(/^\d+\.\s*/, '').trim()
                const notePart = parts[1].trim()
                questions.push({ question: questionPart, note: notePart })
              }
            }
          }
          
          // If we don't have 3 questions, try to extract more from raw response
          if (questions.length < 3) {
            const rawText = reasoning.rawResponse || ""
            const rawLines = rawText.split('\n')
            
            for (const line of rawLines) {
              if (line.trim() && line.match(/^\d+\./)) {
                const parts = line.split('|')
                if (parts.length === 2) {
                  const questionPart = parts[0].replace(/^\d+\.\s*/, '').trim()
                  const notePart = parts[1].trim()
                  
                  // Check if this question is already in our list
                  if (!questions.some(q => q.question.toLowerCase() === questionPart.toLowerCase())) {
                    questions.push({ question: questionPart, note: notePart })
                    if (questions.length >= 3) break
                  }
                }
              }
            }
          }
          
          // If still don't have 3, add conversation-aware default questions
          if (questions.length < 3) {
            const convoText = conversation.map((m) => `${m.role}: ${m.content}`).join(" ").toLowerCase()
            
            let defaultQuestions: Array<{question: string, note: string}> = []
            
            if (convoText.includes('chest') && convoText.includes('pain')) {
              defaultQuestions = [
                { question: "Does the pain radiate to your left arm, jaw, or back?", note: "Radiation patterns help differentiate cardiac from non-cardiac chest pain" },
                { question: "Are you experiencing any shortness of breath or difficulty breathing?", note: "Respiratory symptoms can indicate cardiac or pulmonary causes" },
                { question: "Do you have any history of heart disease or risk factors like diabetes, high blood pressure, or smoking?", note: "Cardiac risk factors increase likelihood of acute coronary syndrome" }
              ]
            } else if (convoText.includes('abdominal') || convoText.includes('stomach')) {
              defaultQuestions = [
                { question: "Can you point to exactly where the pain is located?", note: "Location helps narrow down the differential diagnosis" },
                { question: "Have you had any nausea, vomiting, or changes in bowel movements?", note: "GI symptoms help differentiate between different abdominal conditions" },
                { question: "When did the pain start and has it been getting worse?", note: "Timing and progression are crucial for determining urgency" }
              ]
            } else if (convoText.includes('breath') || convoText.includes('cough')) {
              defaultQuestions = [
                { question: "How long have you had these respiratory symptoms?", note: "Duration helps differentiate acute from chronic conditions" },
                { question: "Do you have any fever or have you been feeling unwell?", note: "Systemic symptoms suggest infectious or inflammatory causes" },
                { question: "Are you a smoker or do you have any lung conditions?", note: "Smoking history and comorbidities affect differential diagnosis" }
              ]
            } else {
              defaultQuestions = [
                { question: "Can you describe your symptoms in more detail?", note: "Detailed symptom description is essential for accurate diagnosis" },
                { question: "When did these symptoms first start?", note: "Onset timing helps determine acute vs chronic conditions" },
                { question: "Have you had similar symptoms before?", note: "Previous episodes can provide important diagnostic clues" }
              ]
            }
            
            // Add default questions to reach 3 total
            for (let i = questions.length; i < 3 && i < questions.length + defaultQuestions.length; i++) {
              const defaultQ = defaultQuestions[i - questions.length]
              if (defaultQ && !questions.some(q => q.question.toLowerCase().includes(defaultQ.question.toLowerCase().split(' ')[0]))) {
                questions.push(defaultQ)
              }
            }
          }
          
          setStructuredQuestions(questions.slice(0, 3)) // Ensure exactly 3 questions
        }

        // Parse differential diagnoses
        if (reasoning.differentialDiagnoses) {
          const diagnoses: Array<{diagnosis: string, percentage: number, reasoning: string}> = []
          const lines = reasoning.differentialDiagnoses.split('\n')
          
          for (const line of lines) {
            if (line.trim() && line.match(/^\d+\./)) {
              // Parse format: "1. Diagnosis - X% - Reasoning"
              const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(\d+)%\s*-\s*(.+)$/)
              if (match) {
                const diagnosis = match[1].trim()
                const percentage = parseInt(match[2])
                const reasoning = match[3].trim()
                diagnoses.push({ diagnosis, percentage, reasoning })
              }
            }
          }
          
          // If we don't have 3 diagnoses, try to get more from AI response
          if (diagnoses.length < 3) {
            // Try to extract more diagnoses from the raw response
            const rawText = reasoning.rawResponse || ""
            const lines = rawText.split('\n')
            
            for (const line of lines) {
              if (line.trim() && line.match(/^\d+\./)) {
                const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(\d+)%\s*-\s*(.+)$/)
                if (match) {
                  const diagnosis = match[1].trim()
                  const percentage = parseInt(match[2])
                  const reasoning = match[3].trim()
                  
                  // Check if this diagnosis is already in our list
                  if (!diagnoses.some(d => d.diagnosis.toLowerCase() === diagnosis.toLowerCase())) {
                    diagnoses.push({ diagnosis, percentage, reasoning })
                    if (diagnoses.length >= 3) break
                  }
                }
              }
            }
          }
          
          // If still don't have 3, use conversation-aware defaults
          if (diagnoses.length < 3) {
            const totalPercentage = diagnoses.reduce((sum, d) => sum + d.percentage, 0)
            const remainingPercentage = Math.max(0, 100 - totalPercentage)
            const remainingSlots = 3 - diagnoses.length
            
            // Analyze conversation content for dynamic defaults
            const convoText = conversation.map((m) => `${m.role}: ${m.content}`).join(" ").toLowerCase()
            
            // Provide conversation-aware default diagnoses
            let defaultDiagnoses: Array<{name: string, reasoning: string}> = []
            
            if (convoText.includes('chest') && convoText.includes('pain')) {
              if (convoText.includes('crushing') || convoText.includes('pressure')) {
                defaultDiagnoses = [
                  { name: "Unstable Angina", reasoning: "Chest pain at rest, consider cardiac etiology" },
                  { name: "GERD", reasoning: "Chest pain may be esophageal in origin" },
                  { name: "Musculoskeletal Pain", reasoning: "Consider chest wall or muscle strain" }
                ]
              } else {
                defaultDiagnoses = [
                  { name: "Pulmonary Embolism", reasoning: "Chest pain with potential respiratory component" },
                  { name: "Pericarditis", reasoning: "Inflammatory chest pain, consider cardiac inflammation" },
                  { name: "Aortic Dissection", reasoning: "Severe chest pain, rule out vascular emergency" }
                ]
              }
            } else if (convoText.includes('abdominal') || convoText.includes('stomach')) {
              defaultDiagnoses = [
                { name: "Gastroenteritis", reasoning: "Abdominal symptoms, consider infectious cause" },
                { name: "Irritable Bowel Syndrome", reasoning: "Chronic abdominal symptoms, consider functional disorder" },
                { name: "Bowel Obstruction", reasoning: "Severe abdominal pain, rule out mechanical obstruction" }
              ]
            } else if (convoText.includes('breath') || convoText.includes('cough')) {
              defaultDiagnoses = [
                { name: "Bronchitis", reasoning: "Respiratory symptoms, consider airway inflammation" },
                { name: "Upper Respiratory Infection", reasoning: "Cough and respiratory symptoms, consider viral cause" },
                { name: "Allergic Reaction", reasoning: "Respiratory symptoms, consider allergic etiology" }
              ]
            } else if (convoText.includes('fever') || convoText.includes('temperature')) {
              defaultDiagnoses = [
                { name: "Viral Infection", reasoning: "Fever with systemic symptoms, consider viral cause" },
                { name: "Bacterial Infection", reasoning: "Fever, consider bacterial etiology requiring antibiotics" },
                { name: "Inflammatory Condition", reasoning: "Fever with systemic symptoms, consider inflammatory process" }
              ]
            } else {
              // Generic fallback based on case context
              const context = getContext()
              const disease = context.disease || ""
              
              if (disease.toLowerCase().includes('mi') || disease.toLowerCase().includes('infarction')) {
                defaultDiagnoses = [
                  { name: "Unstable Angina", reasoning: "Cardiac symptoms, consider acute coronary syndrome" },
                  { name: "Cardiomyopathy", reasoning: "Heart-related symptoms, consider structural heart disease" },
                  { name: "Arrhythmia", reasoning: "Cardiac symptoms, consider rhythm disturbance" }
                ]
              } else if (disease.toLowerCase().includes('appendicitis')) {
                defaultDiagnoses = [
                  { name: "Gastroenteritis", reasoning: "Abdominal symptoms, consider infectious cause" },
                  { name: "Ovarian Cyst", reasoning: "Lower abdominal pain, consider gynecological cause" },
                  { name: "Urinary Tract Infection", reasoning: "Abdominal symptoms, consider urological cause" }
                ]
              } else {
                defaultDiagnoses = [
                  { name: "Viral Syndrome", reasoning: "General symptoms, consider viral cause" },
                  { name: "Stress Response", reasoning: "Symptoms may be stress-related" },
                  { name: "Medication Side Effect", reasoning: "Consider medication-related symptoms" }
                ]
              }
            }
            
            // Add conversation-aware default diagnoses
            for (let i = 0; i < remainingSlots && i < defaultDiagnoses.length; i++) {
              const defaultDiag = defaultDiagnoses[i]
              diagnoses.push({
                diagnosis: defaultDiag.name,
                percentage: Math.round(remainingPercentage / remainingSlots),
                reasoning: defaultDiag.reasoning
              })
            }
          }
          
          setDifferentialDiagnoses(diagnoses.slice(0, 3))
        }
      } catch (error) {
        console.error("Error updating clinical reasoning:", error)
      }
      setIsUpdatingReasoning(false)

      // Update learning insights
      setIsUpdatingInsights(true)
      try {
        const insights = await getLearningInsights(context, conversation, selectedModel)
        setLearningInsights(insights)
      } catch (error) {
        console.error("Error updating learning insights:", error)
      }
      setIsUpdatingInsights(false)
    }

    // Debounce the updates to avoid too many API calls
    const timeoutId = setTimeout(updateRealTimeInsights, 1000)
    return () => clearTimeout(timeoutId)
  }, [conversation, selectedCase, selectedModel])

  // Auto-save card states when they change (but not when navigating)
  useEffect(() => {
    if (!isNavigating && (clinicalReasoning || learningInsights) && conversationWithRoles.length > 0) {
      // Only save after patient responses (completing a question-response pair)
      const lastMessage = conversationWithRoles[conversationWithRoles.length - 1]
      const isPatientResponse = lastMessage && lastMessage.role === "patient"
      
      // Only save if this is a new state (not already in history) and it's a patient response
      const shouldSave = isPatientResponse && (
        currentCardIndex === -1 || 
        (cardHistory.length > 0 && cardHistory[cardHistory.length - 1].conversationLength !== conversationWithRoles.length)
      )
      
      if (shouldSave) {
        saveCardState()
      }
    }
  }, [clinicalReasoning, learningInsights, conversationWithRoles.length])

  const handleSend = async () => {
    if (!selectedCase) return
    setInteractionError(null)
    setIsPatientResponding(true)
    try {
      if (studentInput.trim()) {
        setConversation((prev) => [
          ...prev,
          { role: "student", content: studentInput, timestamp: new Date().toISOString() },
        ])
        setConversationWithRoles((prev) => [
          ...prev,
          { role: "student", content: studentInput, timestamp: new Date().toISOString(), source: "manual" },
        ])
        const aiResponse = await getAIPatientResponse(studentInput, getContext(), selectedModel)
        setConversation((prev) => [
          ...prev,
          { role: "patient", content: aiResponse, timestamp: new Date().toISOString() },
        ])
        setConversationWithRoles((prev) => [
          ...prev,
          { role: "patient", content: aiResponse, timestamp: new Date().toISOString() },
        ])
        setStudentInput("")
      } else if (copilotMode) {
        const convo = conversation.map((m) => `${m.role}: ${m.content}`).join("\n")
        const aiQuestion = await getAIStudentQuestion(convo, getContext(), selectedModel)
        setConversation((prev) => [
          ...prev,
          { role: "student", content: aiQuestion, timestamp: new Date().toISOString() },
        ])
        setConversationWithRoles((prev) => [
          ...prev,
          { role: "student", content: aiQuestion, timestamp: new Date().toISOString(), source: "ai" },
        ])
        const aiResponse = await getAIPatientResponse(aiQuestion, getContext(), selectedModel)
        setConversation((prev) => [
          ...prev,
          { role: "patient", content: aiResponse, timestamp: new Date().toISOString() },
        ])
        setConversationWithRoles((prev) => [
          ...prev,
          { role: "patient", content: aiResponse, timestamp: new Date().toISOString() },
        ])
      }
    } catch (error) {
      console.error("Failed to generate AI conversation turn:", error)
      setInteractionError(error instanceof Error ? error.message : "Failed to process conversation turn.")
    } finally {
      setIsPatientResponding(false)
    }
  }

  const handleEvaluate = async () => {
    setIsEvaluating(true)
    const result = await getEvaluation(conversation, differentialDiagnosis, getContext())
    // Only count student questions for "Questions Asked"
    const questionCount = conversation.filter((msg) => msg.role === "student").length
    const evaluationWithMetadata = {
      ...result,
      caseId: selectedCase?.id,
      caseName: selectedCase?.title,
      model: GRADING_MODEL,
      timestamp: new Date().toISOString(),
      conversationLength: questionCount,
    }
    setEvaluation(evaluationWithMetadata)
    setEvaluationHistory((prev) => [evaluationWithMetadata, ...prev])
    setIsEvaluating(false)
  }

  const handleGetHelp = async () => {
    if (conversation.length === 0) return
    setIsLoadingHelp(true)
    const help = await getDifferentialDiagnosisHelp(getContext(), conversation, selectedModel)
    setDiagnosticHelp(help)
    setIsLoadingHelp(false)
  }

  const handleCaseChange = (caseId: string) => {
    const newCase = sampleCases.find((c) => c.id === caseId)
    setSelectedCase(newCase)
    setConversation([])
    setConversationWithRoles([])
    setDifferentialDiagnosis("")
    setEvaluation(null)
    setDiagnosticHelp(null)
    setClinicalReasoning(null)
    setLearningInsights(null)
    setStructuredQuestions([])
    setDifferentialDiagnoses([])
    setStudentDoctorChat([])
    setStudentQuestion("")
    setCardHistory([])
    setCurrentCardIndex(-1)
    setIsNavigating(false)
    setIsDoctorChatOpen(false)
    setIsDoctorChatMinimized(false)
    setChatPosition({ x: 0, y: 0 })
    setIsDragging(false)
  }

  const overlayLayer = embedInAppShell ? "absolute" : "fixed"
  const floatLayer = embedInAppShell ? "absolute" : "fixed"

  return (
    <div className={`flex flex-col bg-gray-50 ${embedInAppShell ? "relative h-full min-h-0" : "h-screen"}`}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900">MedSim Pro</h1>
              <p className="text-sm text-gray-600">AI-Powered Medical Simulation Platform</p>
            </div>
            <Badge variant="outline" className={`${isEvaluationMode ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              {isEvaluationMode ? "Evaluation Mode" : (selectedCase?.disease || "Internal Medicine")}
            </Badge>
            {isEvaluationMode && selectedCase && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{selectedCase.title}</span>
                <span>•</span>
                <span>A {selectedCase.patientProfile.age}-year-old patient with {selectedCase.symptoms[0].toLowerCase()}</span>
              </div>
            )}
            {selectedCase && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{isEvaluationMode ? "Ready for evaluation" : "Consulting with patient"}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100 text-blue-700 hover:text-blue-800 transition-all duration-300">
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            
            {!isEvaluationMode && (
            <Select value={selectedCase?.id || ""} onValueChange={handleCaseChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Patient Case" />
              </SelectTrigger>
              <SelectContent>
                {filteredCases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-gray-500">
                        {c.difficulty}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch id="copilot" checked={copilotMode} onCheckedChange={setCopilotMode} />
              <Label htmlFor="copilot" className="flex items-center gap-2 text-sm">
                <Brain className="h-4 w-4" />
                Copilot Mode
              </Label>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{selectedModel.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - MedSim Pro */}
        <div className="w-1/3 border-r bg-white flex flex-col">
          <div className="p-4 border-b bg-blue-50">
            <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              MedSim Pro
            </h2>
            <p className="text-sm text-blue-700">AI-Powered Medical Simulation</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Case Information Panel - Only in Evaluation Mode */}
            {isEvaluationMode && selectedCase && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Case Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Case Template Format */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Age</span>
                        <span className="font-medium">{selectedCase.patientProfile.age}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Symptoms</span>
                        <span className="font-medium">{selectedCase.symptoms.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">
                          ~{selectedCase.difficulty === 'beginner' ? '20' : selectedCase.difficulty === 'intermediate' ? '30' : '45'} min
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Expected Questions</span>
                        <span className="font-medium">{selectedCase.expectedQuestions?.length || 5}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Difficulty</span>
                        <Badge variant="outline" className={
                          selectedCase.difficulty === 'beginner' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedCase.difficulty === 'intermediate' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }>
                          {selectedCase.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Specialty</span>
                        <span className="font-medium">{selectedCase.specialty}</span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Profile */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Patient Profile</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedCase.patientProfile.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{selectedCase.patientProfile.age} years old</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium">{selectedCase.patientProfile.gender}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Occupation:</span>
                        <span className="font-medium">{selectedCase.patientProfile.occupation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Presenting Symptoms */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Presenting Symptoms</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCase.symptoms.map((symptom: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {conversationWithRoles.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Start the consultation by asking the patient a question</p>
              </div>
            )}

            {conversationWithRoles.map((msg, idx) => {
              // Determine if this message should be highlighted based on current card state
              const shouldHighlight = currentCardIndex >= 0 && 
                cardHistory[currentCardIndex] && 
                idx < cardHistory[currentCardIndex].conversationLength
              
              return (
                <div key={idx} className="space-y-2">
                  {msg.role === "patient" && (
                    <div className={`rounded-lg p-4 shadow-sm border transition-all duration-300 ${
                      shouldHighlight 
                        ? "bg-yellow-50 border-yellow-300 shadow-md" 
                        : "bg-white border-gray-200"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Patient</span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-gray-800 text-left">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="text-left mb-2 last:mb-0">{children}</p>,
                            h1: ({ children }) => <h1 className="text-left text-lg font-bold mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-left text-base font-semibold mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-left text-sm font-semibold mb-1">{children}</h3>,
                            ul: ({ children }) => <ul className="text-left list-disc list-inside mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="text-left list-decimal list-inside mb-2">{children}</ol>,
                            li: ({ children }) => <li className="text-left mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="text-left border-l-4 border-gray-300 pl-4 italic">{children}</blockquote>
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {msg.role === "student" && (
                    <div className="flex justify-end">
                      <div className={`text-white rounded-lg p-3 max-w-xs transition-all duration-300 ${
                        shouldHighlight 
                          ? "bg-yellow-500 shadow-md" 
                          : "bg-blue-500"
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {msg.source === "manual" ? "Student" : 
                             msg.source === "ai" ? "Doctor (AI)" : 
                             msg.source === "suggested" ? "Suggested Question" : "You"}
                          </span>
                        </div>
                        <div className="text-sm text-left">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="text-left mb-2 last:mb-0">{children}</p>,
                              h1: ({ children }) => <h1 className="text-left text-lg font-bold mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-left text-base font-semibold mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-left text-sm font-semibold mb-1">{children}</h3>,
                              ul: ({ children }) => <ul className="text-left list-disc list-inside mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="text-left list-decimal list-inside mb-2">{children}</ol>,
                              li: ({ children }) => <li className="text-left mb-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                              blockquote: ({ children }) => <blockquote className="text-left border-l-4 border-gray-300 pl-4 italic">{children}</blockquote>
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
      </div>
    )
            })}
          </div>
          
          {/* Input Section */}
          <div className="p-4 border-t bg-gray-50">
            {interactionError ? <p className="mb-3 text-sm text-red-600">{interactionError}</p> : null}
            {copilotMode ? (
              /* Copilot Mode - AI Doctor Button */
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={handleSend}
                  disabled={isPatientResponding}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 text-lg font-medium"
                >
                  {isPatientResponding ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>AI Doctor is asking...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      <span>Let AI Doctor Ask Question</span>
                    </div>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  The AI doctor will automatically ask the next most relevant question
                </p>
              </div>
            ) : (
              /* Manual Mode - Text Input */
              <div className="flex items-center gap-2">
                <Textarea
                  className="flex-1 min-h-[60px] resize-none border-gray-200 focus:border-blue-300"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder="Ask the patient a question..."
                  disabled={isPatientResponding}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isPatientResponding) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={isPatientResponding || !studentInput.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2"
                >
                  {isPatientResponding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
            
            {/* Helpers Section */}
            {showHelpers && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Diagnostic Help</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetHelp}
                    disabled={isLoadingHelp || conversation.length === 0}
                    className="text-xs"
                  >
                    {isLoadingHelp ? "Loading..." : "Get Help"}
                  </Button>
                </div>
                
                {diagnosticHelp && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200 text-sm">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium text-gray-900">Differential Diagnoses:</h4>
                        <div className="text-gray-700">
                          <ReactMarkdown>{diagnosticHelp.differentialDiagnoses}</ReactMarkdown>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Clinical Reasoning:</h4>
                        <div className="text-gray-700">
                          <ReactMarkdown>{diagnosticHelp.reasoning}</ReactMarkdown>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Next Questions:</h4>
                        <div className="text-gray-700">
                          <ReactMarkdown>{diagnosticHelp.nextQuestions}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - Doctor Mind */}
        <div className="w-1/3 border-r bg-white flex flex-col">
          <div className="p-4 border-b bg-green-50">
            <h2 className="text-lg font-semibold text-green-900 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Doctor Mind
            </h2>
            <p className="text-sm text-green-700">Clinical Reasoning Assistant</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedCase ? (
              <div className="text-center text-gray-500 mt-20">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a patient case to begin clinical reasoning</p>
              </div>
            ) : conversation.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Start the conversation to see clinical reasoning</p>
              </div>
            ) : !clinicalReasoning ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p>Loading clinical reasoning...</p>
              </div>
            ) : (
              <>
                {/* Clinical Assessment */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Clinical Assessment
                  </h3>
                  <div className="text-sm text-blue-800">
                    <ReactMarkdown>{clinicalReasoning.clinicalAssessment}</ReactMarkdown>
                  </div>
                </div>

                {/* Red Flags */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Red Flags
                  </h3>
                  <div className="text-sm text-red-800">
                    <ReactMarkdown>{clinicalReasoning.redFlags}</ReactMarkdown>
                  </div>
                </div>

                {/* Differential Diagnoses */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Differential Diagnoses
                  </h3>
                  {differentialDiagnoses.length > 0 ? (
                    <div className="space-y-3">
                      {differentialDiagnoses.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-yellow-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-yellow-900">
                              {item.diagnosis}
                            </span>
                            <span className="text-sm font-bold text-yellow-700">
                              {item.percentage}%
                            </span>
                          </div>
                          <Progress 
                            value={item.percentage} 
                            className="h-2 mb-2"
                          />
                          <p className="text-xs text-blue-700 italic">
                            {item.reasoning}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-blue-800">
                      <ReactMarkdown>{clinicalReasoning.differentialDiagnoses}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Next Questions Strategy */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Next Questions Strategy
                  </h3>
                  {structuredQuestions.length > 0 ? (
                    <div className="space-y-3">
                      {structuredQuestions.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-green-200 hover:border-green-300 transition-colors">
                          <button
                            onClick={() => handleQuestionClick(item.question)}
                            disabled={isPatientResponding}
                            className="w-full text-left group"
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-green-900 group-hover:text-green-700 transition-colors">
                                  {item.question}
                                </p>
                                <p className="text-xs text-green-600 mt-1 italic">
                                  {item.note}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <Send className="h-3 w-3 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-green-800">
                      <ReactMarkdown>{clinicalReasoning.nextPriorityQuestions}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Clinical Reasoning */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Clinical Reasoning
                  </h3>
                  <div className="text-sm text-purple-800">
                    <ReactMarkdown>{clinicalReasoning.clinicalReasoning}</ReactMarkdown>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Learning Insights */}
        <div className="w-1/3 bg-white flex flex-col">
          <div className="p-4 border-b bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Learning Insights
                </h2>
                <p className="text-sm text-purple-700">Educational Content</p>
              </div>
              {cardHistory.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousCard}
                    disabled={currentCardIndex <= 0}
                    className="h-8 w-8 p-0"
                  >
                    ←
                  </Button>
                  <span className="text-xs text-purple-600">
                    {currentCardIndex === -1 ? "Current" : `${currentCardIndex + 1}/${cardHistory.length}`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextCard}
                    disabled={currentCardIndex >= cardHistory.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    →
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className={`grid w-full m-4 mb-0 gap-1 ${isEvaluationMode ? 'grid-cols-5' : 'grid-cols-3'}`}>
                <TabsTrigger value="educational-content" className="text-xs px-2 py-1">Educational Content</TabsTrigger>
                {isEvaluationMode && (
                  <TabsTrigger value="nurse-report" className="text-xs px-2 py-1">Nurse Report</TabsTrigger>
                )}
                <TabsTrigger value="key-points" className="text-xs px-2 py-1">Key Points</TabsTrigger>
                <TabsTrigger value="guidelines" className="text-xs px-2 py-1">Guidelines</TabsTrigger>
                <TabsTrigger value="pearls" className="text-xs px-2 py-1">Pearls</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto p-4">
                {isEvaluationMode && (
                  <TabsContent value="nurse-report" className="space-y-4">
                    {!selectedCase ? (
                      <div className="text-center text-gray-500 mt-20">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Select a patient case to view nurse report</p>
                      </div>
                    ) : (
                      <>
                        {/* Animated Nurse Report Card */}
                        <div className={`transition-all duration-1000 ease-out ${
                          nurseReportAnimated 
                            ? 'transform translate-x-0 opacity-100' 
                            : 'transform translate-x-full opacity-0'
                        }`}>
                          <Card className="shadow-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                                  <FileText className="h-5 w-5" />
                                  Nurse Report
                                </CardTitle>
                                <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                                  {selectedCase.difficulty}
                                </Badge>
                              </div>
                              <p className="text-sm text-blue-700">Initial Patient Assessment - {new Date().toLocaleDateString()}</p>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                              {/* Case Overview */}
                              <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Case Overview</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-600">Title:</span>
                                    <p className="font-medium text-gray-900">{selectedCase.title}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Specialty:</span>
                                    <p className="font-medium text-gray-900">{selectedCase.specialty}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Time:</span>
                                    <p className="font-medium text-gray-900">
                                      ~{selectedCase.difficulty === 'beginner' ? '20' : selectedCase.difficulty === 'intermediate' ? '30' : '45'} min
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Symptoms:</span>
                                    <p className="font-medium text-gray-900">{selectedCase.symptoms.length}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Patient Profile */}
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-2 text-sm flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Patient Profile
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-blue-700">Name:</span>
                                    <p className="font-medium text-blue-900">{selectedCase.patientProfile.name}</p>
                                  </div>
                                  <div>
                                    <span className="text-blue-700">Age:</span>
                                    <p className="font-medium text-blue-900">{selectedCase.patientProfile.age} years</p>
                                  </div>
                                  <div>
                                    <span className="text-blue-700">Gender:</span>
                                    <p className="font-medium text-blue-900">{selectedCase.patientProfile.gender}</p>
                                  </div>
                                  <div>
                                    <span className="text-blue-700">Occupation:</span>
                                    <p className="font-medium text-blue-900">{selectedCase.patientProfile.occupation}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Presenting Symptoms */}
                              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                <h4 className="font-semibold text-orange-900 mb-2 text-sm flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  Presenting Symptoms
                                </h4>
                                <div className="space-y-1">
                                  <div className="text-xs">
                                    <span className="text-orange-700 font-medium">Primary:</span>
                                    <p className="text-orange-900">{selectedCase.symptoms[0]}</p>
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-orange-700 font-medium">Additional:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {selectedCase.symptoms.slice(1, 4).map((symptom: string, index: number) => (
                                        <Badge key={index} variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                          {symptom}
                                        </Badge>
                                      ))}
                                      {selectedCase.symptoms.length > 4 && (
                                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                          +{selectedCase.symptoms.length - 4} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Clinical Notes */}
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <h4 className="font-semibold text-green-900 mb-2 text-sm flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Clinical Notes
                                </h4>
                                <div className="text-xs text-green-800 space-y-1">
                                  <p>• Patient alert and oriented</p>
                                  <p>• Initial assessment completed</p>
                                  <p>• Ready for physician evaluation</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                      </>
                    )}
                  </TabsContent>
                )}
                
                <TabsContent value="educational-content" className="space-y-4">
                  {!selectedCase ? (
                    <div className="text-center text-gray-500 mt-20">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a patient case to view educational content</p>
                    </div>
                  ) : (
                    <>
                          {/* Learning Objectives */}
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Learning Objectives
                        </h3>
                        <div className="text-sm text-purple-800 space-y-2">
                              <p>• Develop differential diagnosis skills for {selectedCase.specialty.toLowerCase()} cases</p>
                              <p>• Practice clinical reasoning and decision-making processes</p>
                              <p>• Learn appropriate questioning techniques for patient interviews</p>
                              <p>• Understand diagnostic workup approaches and clinical guidelines</p>
                          <p>• Apply medical knowledge in realistic clinical scenarios</p>
                            </div>
                          </div>

                          {/* Expected Questions */}
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Expected Questions ({selectedCase.expectedQuestions?.length || 5})
                        </h3>
                        <div className="text-sm text-blue-800 space-y-2">
                              <p>• What brings you in today?</p>
                              <p>• When did your symptoms start?</p>
                              <p>• Can you describe your symptoms in detail?</p>
                              <p>• Do you have any medical history?</p>
                              <p>• Are you taking any medications?</p>
                          <p>• Have you had similar symptoms before?</p>
                          <p>• What makes your symptoms better or worse?</p>
                            </div>
                          </div>

                          {/* Case Complexity */}
                          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Case Complexity
                        </h3>
                        <div className="text-sm text-orange-800 space-y-2">
                          <p><span className="font-medium">Difficulty Level:</span> <span className="capitalize">{selectedCase.difficulty}</span></p>
                          <p><span className="font-medium">Estimated Duration:</span> 
                            <span className="ml-1">
                                {selectedCase.difficulty === 'beginner' ? '20-30 minutes' : 
                                 selectedCase.difficulty === 'intermediate' ? '30-45 minutes' : 
                                 '45-60 minutes'}
                            </span>
                          </p>
                          <p><span className="font-medium">Focus Areas:</span> History taking, differential diagnosis, clinical reasoning</p>
                          <p><span className="font-medium">Specialty:</span> {selectedCase.specialty}</p>
                          {selectedCase.isRare && (
                            <p><span className="font-medium text-red-600">Note:</span> This is a rare disease case - consider subtle clues and specialized testing</p>
                          )}
                            </div>
                      </div>

                      {/* Clinical Skills */}
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          Clinical Skills to Practice
                        </h3>
                        <div className="text-sm text-green-800 space-y-2">
                          <p>• Systematic history taking</p>
                          <p>• Symptom characterization (onset, duration, severity, triggers)</p>
                          <p>• Review of systems</p>
                          <p>• Past medical history and medication review</p>
                          <p>• Family history and social history</p>
                          <p>• Differential diagnosis formation</p>
                          <p>• Clinical reasoning and decision making</p>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                
                <TabsContent value="key-points" className="space-y-4">
                  {!selectedCase ? (
                    <div className="text-center text-gray-500 mt-20">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a patient case to begin learning</p>
                    </div>
                  ) : conversation.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Start the conversation to see learning insights</p>
                    </div>
                  ) : !learningInsights ? (
                    <div className="text-center text-gray-500 mt-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p>Loading learning insights...</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="font-semibold text-blue-900 mb-2">Key Learning Points</h3>
                        <div className="text-sm text-blue-800">
                          <ReactMarkdown>{learningInsights.keyPoints || "No key points available yet."}</ReactMarkdown>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h3 className="font-semibold text-green-900 mb-2">Focus Areas</h3>
                        <div className="text-sm text-green-800">
                          <ReactMarkdown>{learningInsights.focusAreas || "No focus areas available yet."}</ReactMarkdown>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h3 className="font-semibold text-red-900 mb-2">Common Pitfalls</h3>
                        <div className="text-sm text-red-800">
                          <ReactMarkdown>{learningInsights.commonPitfalls || "No common pitfalls identified yet."}</ReactMarkdown>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="guidelines" className="space-y-4">
                  {!selectedCase ? (
                    <div className="text-center text-gray-500 mt-20">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a patient case to view guidelines</p>
                    </div>
                  ) : conversation.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Start the conversation to see clinical guidelines</p>
                    </div>
                  ) : !learningInsights ? (
                    <div className="text-center text-gray-500 mt-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p>Loading clinical guidelines...</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h3 className="font-semibold text-yellow-900 mb-2">Clinical Guidelines</h3>
                      <div className="text-sm text-yellow-800">
                        <ReactMarkdown>{learningInsights.clinicalGuidelines || "No clinical guidelines available yet."}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="pearls" className="space-y-4">
                  {!selectedCase ? (
                    <div className="text-center text-gray-500 mt-20">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a patient case to view clinical pearls</p>
                    </div>
                  ) : conversation.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Start the conversation to see clinical pearls</p>
                    </div>
                  ) : !learningInsights ? (
                    <div className="text-center text-gray-500 mt-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p>Loading clinical pearls...</p>
                    </div>
                  ) : (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-semibold text-purple-900 mb-2">Clinical Pearls</h3>
                      <div className="text-sm text-purple-800">
                        <ReactMarkdown>{learningInsights.clinicalPearls || "No clinical pearls available yet."}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Ask Doctor Button - Only visible in copilot mode */}
      {copilotMode && !isDoctorChatOpen && (
        <div className={`${embedInAppShell ? "absolute" : "fixed"} bottom-6 right-6 z-50`}>
          <Button
            onClick={() => setIsDoctorChatOpen(true)}
            className="rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 animate-bounce"
            size="lg"
          >
            <Brain className="h-5 w-5 mr-2" />
            Ask Doctor
            <div className="ml-2 animate-pulse">💬</div>
          </Button>
        </div>
      )}

      {/* Enhanced Student-Doctor Chat Box - Only visible in copilot mode */}
      {copilotMode && isDoctorChatOpen && (
        <div 
          className={`${floatLayer} w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 transition-all duration-300 ${
            isDoctorChatMinimized ? 'h-12' : 'h-96'
          }`}
          style={{
            left: chatPosition.x || 'calc(100vw - 340px)',
            top: chatPosition.y || 'calc(100vh - 400px)',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleChatMouseDown}
        >
          {/* Chat Header */}
          <div className="chat-header p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg cursor-move">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-blue-900 text-sm">Ask Doctor</h3>
                {studentDoctorChat.length > 0 && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDoctorChatMinimized(!isDoctorChatMinimized)}
                  className="h-6 w-6 p-0 hover:bg-blue-100"
                >
                  {isDoctorChatMinimized ? '↑' : '↓'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsDoctorChatOpen(false)
                    setIsDoctorChatMinimized(false)
                  }}
                  className="h-6 w-6 p-0 hover:bg-red-100"
                >
                  ×
                </Button>
              </div>
            </div>
            {!isDoctorChatMinimized && (
              <p className="text-xs text-blue-700 mt-1">Ask questions to the AI doctor</p>
            )}
          </div>
          
          {/* Chat Content */}
          {!isDoctorChatMinimized && (
            <>
              <div className="h-64 overflow-y-auto p-3 space-y-2">
                {studentDoctorChat.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Ask the doctor any questions about the case</p>
                    <p className="text-xs mt-1">Get guidance on clinical reasoning</p>
                  </div>
                )}
                
                {studentDoctorChat.map((msg, idx) => (
                  <div key={idx} className="space-y-1">
                    {msg.role === "student" && (
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-2 max-w-xs text-sm shadow-sm">
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    )}
                    
                    {msg.role === "doctor" && (
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2 text-sm border border-gray-200">
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Doctor</span>
                        </div>
                        <div className="text-gray-800 text-left">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="text-left mb-2 last:mb-0">{children}</p>,
                              h1: ({ children }) => <h1 className="text-left text-lg font-bold mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-left text-base font-semibold mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-left text-sm font-semibold mb-1">{children}</h3>,
                              ul: ({ children }) => <ul className="text-left list-disc list-inside mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="text-left list-decimal list-inside mb-2">{children}</ol>,
                              li: ({ children }) => <li className="text-left mb-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                              blockquote: ({ children }) => <blockquote className="text-left border-l-4 border-gray-300 pl-4 italic">{children}</blockquote>
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isDoctorResponding && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2 text-sm border border-gray-200">
                    <div className="flex items-center gap-1 mb-1">
                      <Brain className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Doctor</span>
                      <div className="flex gap-1 ml-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                    <p className="text-gray-500">Doctor is thinking...</p>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="p-3 border-t bg-gray-50 rounded-b-lg">
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1 text-sm border-gray-200 focus:border-blue-300"
                    value={studentQuestion}
                    onChange={(e) => setStudentQuestion(e.target.value)}
                    placeholder="Ask the doctor..."
                    disabled={isDoctorResponding}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isDoctorResponding) handleStudentToDoctorQuestion()
                    }}
                  />
                  <Button
                    onClick={handleStudentToDoctorQuestion}
                    disabled={isDoctorResponding || !studentQuestion.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Evaluation Mode Landing Page */}
      {isEvaluationMode && showEvaluationLanding && (
        <div className={`${overlayLayer} inset-0 bg-gradient-to-br from-red-50 via-white to-orange-50 overflow-y-auto z-50`}>
          <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900">AI Evaluation Mode</h1>
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-red-600" />
                  <p className="text-lg text-gray-600">Master Clinical Skills Through AI-Powered Assessment</p>
                </div>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Transform your medical education with interactive, AI-powered evaluation experiences. 
                  Develop clinical reasoning, improve patient communication, and build confidence through realistic case scenarios.
                </p>
              </div>

              {/* Skill Cards */}
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Clinical Reasoning</h3>
                  <p className="text-sm text-gray-600">Develop systematic approaches</p>
                </Card>
                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Patient Communication</h3>
                  <p className="text-sm text-gray-600">Practice interview techniques</p>
                </Card>
                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Diagnostic Skills</h3>
                  <p className="text-sm text-gray-600">Build differential diagnosis</p>
                </Card>
              </div>

              {/* Action Cards */}
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                {/* Generate New Case */}
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={handleNavigateToGenerate}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900">Generate New Case</CardTitle>
                    <CardDescription className="text-gray-600">
                      Create a personalized evaluation experience tailored to your
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Customization Options:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Choose specialty (Cardiology, Neurology, etc.)</li>
                        <li>• Set difficulty level (Beginner to Advanced)</li>
                        <li>• Toggle rare disease cases</li>
                        <li>• Select case type (Emergency, Outpatient, Chronic)</li>
                      </ul>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Case
                    </Button>
                  </CardContent>
                </Card>

                {/* Select Existing Case */}
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={handleNavigateToSelect}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900">Browse Cases</CardTitle>
                    <CardDescription className="text-gray-600">
                      Explore our comprehensive library of carefully curated
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Available Cases:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• {sampleCases.length} pre-built cases</li>
                        <li>• Multiple specialties covered</li>
                        <li>• Various difficulty levels</li>
                        <li>• Both common and rare diseases</li>
                      </ul>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white">
                      <FileText className="h-4 w-4 mr-2" />
                      Browse Cases
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Back to Dashboard */}
              <div className="text-center">
                <Link href="/">
                  <Button variant="outline" className="flex items-center gap-2 mx-auto">
                    <Home className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Generation Form Modal */}
      {isEvaluationMode && showCaseGenerationForm && (
        <div className={`${overlayLayer} inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Generate New Case</h2>
                    <p className="text-sm text-gray-600">Customize your evaluation case</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCaseGenerationForm(false)
                    setShowEvaluationLanding(true)
                  }}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Specialty Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Specialty</label>
                <Select value={caseFormData.specialty} onValueChange={(value) => setCaseFormData(prev => ({ ...prev, specialty: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty (or leave blank for random)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random Specialty</SelectItem>
                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                    <SelectItem value="Neurology">Neurology</SelectItem>
                    <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                    <SelectItem value="Pulmonology">Pulmonology</SelectItem>
                    <SelectItem value="Gastroenterology">Gastroenterology</SelectItem>
                    <SelectItem value="Nephrology">Nephrology</SelectItem>
                    <SelectItem value="Hematology">Hematology</SelectItem>
                    <SelectItem value="Oncology">Oncology</SelectItem>
                    <SelectItem value="General Medicine">General Medicine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Difficulty Level</label>
                <Select value={caseFormData.difficultyLevel} onValueChange={(value) => setCaseFormData(prev => ({ ...prev, difficultyLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - Common diseases, fewer symptoms, obvious clues</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Moderate complexity, multiple symptoms</SelectItem>
                    <SelectItem value="advanced">Advanced - Rare diseases possible, multi-system involvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rare Case Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rare Disease Case</label>
                    <p className="text-xs text-gray-500">Include rare diseases like Marfan syndrome, Addison's disease, Wilson's disease</p>
                  </div>
                  <Switch
                    checked={caseFormData.rareCase}
                    onCheckedChange={(checked) => setCaseFormData(prev => ({ ...prev, rareCase: checked }))}
                  />
                </div>
              </div>

              {/* Case Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Case Type (Optional)</label>
                <Select value={caseFormData.caseType} onValueChange={(value) => setCaseFormData(prev => ({ ...prev, caseType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Type</SelectItem>
                    <SelectItem value="emergency">Emergency - Acute presentation</SelectItem>
                    <SelectItem value="outpatient">Outpatient - Clinic visit</SelectItem>
                    <SelectItem value="chronic">Chronic - Follow-up care</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCaseGenerationForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateNewCase}
                  disabled={isGeneratingCase}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                >
                  {isGeneratingCase ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Case...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Case
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Selection Page */}
      {isEvaluationMode && showCaseSelection && (
        <div className={`${overlayLayer} inset-0 bg-gray-50 overflow-y-auto z-50`}>
          <div className="min-h-screen">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-gray-900">Evaluation Mode</h1>
                    <p className="text-sm text-gray-600">Select a case for evaluation</p>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Evaluation Mode
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCaseSelection(false)
                      setShowEvaluationLanding(true)
                    }}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Link href="/">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={() => setShowCaseGenerationForm(true)}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generate New Case
                  </Button>
                </div>
              </div>
            </div>

            {/* Case Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sampleCases.map((caseItem) => (
                  <Card key={caseItem.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => handleCaseSelection(caseItem.id)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg group-hover:text-red-600 transition-colors">{caseItem.title}</CardTitle>
                        <Badge variant="outline" className={caseItem.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : caseItem.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                          {caseItem.difficulty}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{caseItem.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Case Info Template */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Age</span>
                            <span className="font-medium">{caseItem.patientProfile.age}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Symptoms</span>
                            <span className="font-medium">{caseItem.symptoms.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Duration</span>
                            <span className="font-medium">
                              ~{caseItem.difficulty === 'beginner' ? '20' : caseItem.difficulty === 'intermediate' ? '30' : '45'} min
                            </span>
                          </div>
                        </div>

                        {/* Patient Profile */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-900">Patient Profile</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-gray-500" />
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium">{caseItem.patientProfile.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <span className="text-gray-600">Age:</span>
                              <span className="font-medium">{caseItem.patientProfile.age}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-500" />
                              <span className="text-gray-600">Gender:</span>
                              <span className="font-medium">{caseItem.patientProfile.gender}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3 text-gray-500" />
                              <span className="text-gray-600">Occupation:</span>
                              <span className="font-medium">{caseItem.patientProfile.occupation}</span>
                            </div>
                          </div>
                        </div>

                        {/* Presenting Symptoms */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-gray-900">Presenting Symptoms</h4>
                          <div className="flex flex-wrap gap-1">
                            {caseItem.symptoms.slice(0, 3).map((symptom, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                            {caseItem.symptoms.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{caseItem.symptoms.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Case Tags */}
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">{caseItem.specialty}</Badge>
                          {caseItem.isRare && <Badge variant="destructive" className="text-xs">Rare</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nurse Report Modal for Evaluation Mode */}
      {isEvaluationMode && showNurseReport && selectedCase && (
        <div className={`${overlayLayer} inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Nurse Report</h2>
                    <p className="text-sm text-gray-600">Initial Patient Assessment</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                  {selectedCase.difficulty}
                </Badge>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Case Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  Case Overview
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Chief Complaint:</span>
                    <p className="font-medium text-gray-900">{selectedCase.symptoms[0]}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Specialty:</span>
                    <p className="font-medium text-gray-900">{selectedCase.specialty}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Case Complexity:</span>
                    <p className="font-medium text-gray-900 capitalize">{selectedCase.difficulty}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Duration:</span>
                    <p className="font-medium text-gray-900">
                      ~{selectedCase.difficulty === 'beginner' ? '20' : selectedCase.difficulty === 'intermediate' ? '30' : '45'} min
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Profile */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient Profile
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Name:</span>
                    <p className="font-medium text-blue-900">{selectedCase.patientProfile.name}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Age:</span>
                    <p className="font-medium text-blue-900">{selectedCase.patientProfile.age} years old</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Gender:</span>
                    <p className="font-medium text-blue-900">{selectedCase.patientProfile.gender}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Occupation:</span>
                    <p className="font-medium text-blue-900">{selectedCase.patientProfile.occupation}</p>
                  </div>
                </div>
              </div>

              {/* Presenting Symptoms */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Presenting Symptoms
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-orange-700">Primary Complaint:</span>
                    <span className="font-medium text-orange-900">{selectedCase.symptoms[0]}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-orange-700">Additional Symptoms:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCase.symptoms.slice(1).map((symptom: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Notes */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Clinical Notes
                </h3>
                <div className="text-sm text-green-800 space-y-2">
                  <p>• Patient arrived via {selectedCase.caseType === 'emergency' ? 'emergency department' : 'outpatient clinic'}</p>
                  <p>• Initial assessment completed by nursing staff</p>
                  <p>• Patient is alert and oriented x3 (person, place, time)</p>
                  <p>• Vital signs: BP 120/80, HR 72, RR 16, Temp 98.6°F</p>
                  <p>• No immediate life-threatening conditions observed</p>
                  <p>• Patient appears comfortable at rest</p>
                  <p>• Ready for physician evaluation</p>
                </div>
              </div>

              {/* Initial Assessment */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Initial Assessment
                </h3>
                <div className="text-sm text-orange-800 space-y-2">
                  <p>• Patient reports {selectedCase.symptoms[0].toLowerCase()}</p>
                  <p>• Onset: {selectedCase.difficulty === 'beginner' ? 'Gradual' : selectedCase.difficulty === 'intermediate' ? 'Subacute' : 'Variable'} presentation</p>
                  <p>• Severity: {selectedCase.difficulty === 'beginner' ? 'Mild to moderate' : selectedCase.difficulty === 'intermediate' ? 'Moderate' : 'Moderate to severe'}</p>
                  <p>• Associated symptoms: {selectedCase.symptoms.slice(1, 3).join(', ')}</p>
                  <p>• No known drug allergies</p>
                  <p>• Previous medical history: {selectedCase.difficulty === 'beginner' ? 'Unremarkable' : 'Requires further evaluation'}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleStartCaseFromNurseReport}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 text-lg"
                >
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Begin Patient Interview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export function EvaluationPage({
  initialCopilotMode = false,
  skipExternalRedirects = false,
  embedInAppShell = false,
}: {
  initialCopilotMode?: boolean
  skipExternalRedirects?: boolean
  embedInAppShell?: boolean
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <EvaluationPageContent
        initialCopilotMode={initialCopilotMode}
        skipExternalRedirects={skipExternalRedirects}
        embedInAppShell={embedInAppShell}
      />
    </Suspense>
  )
}
