import type { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import type { ConversationContext } from "@/lib/fyp/data-models"
import { BEST_GEMINI_MODEL, runNewGemini } from "@/lib/fyp/llm-gemini"

interface SuggestedQuestion {
  id: string
  question: string
  category: string
  importance: "high" | "medium" | "low"
  rationale: string
  confidence: number
  tags: string[]
}

function hydrateGeminiApiKeyFromBackendEnv() {
  if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) return
  const backendEnvPath = path.resolve(process.cwd(), "../backend/.env")
  if (!fs.existsSync(backendEnvPath)) return
  const match = fs.readFileSync(backendEnvPath, "utf8").match(
    /^(?:GOOGLE_API_KEY|GEMINI_API_KEY)\s*=\s*("?)(.*?)\1\s*$/m,
  )
  if (match?.[2]) {
    const key = match[2].trim().replace(/^["']+|["']+$/g, "")
    if (key) process.env.GOOGLE_API_KEY = key
  }
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim()
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeText(value).split(" ").filter((w) => w.length > 3))
}

function overlapRatio(a: string, b: string): number {
  const ta = tokenSet(a)
  const tb = tokenSet(b)
  if (!ta.size || !tb.size) return 0
  let shared = 0
  for (const t of ta) {
    if (tb.has(t)) shared += 1
  }
  return shared / Math.min(ta.size, tb.size)
}

function wasAlreadyAsked(question: string, studentMessages: string[]): boolean {
  const nq = normalizeText(question)
  return studentMessages.some((asked) => {
    const na = normalizeText(asked)
    if (!na || !nq) return false
    if (na.includes(nq) || nq.includes(na)) return true
    return overlapRatio(question, asked) >= 0.55
  })
}

const QUESTION_POOL: Omit<SuggestedQuestion, "id">[] = [
  {
    question: "When did these symptoms first start, and were they sudden or gradual?",
    category: "History",
    importance: "high",
    rationale: "Symptom onset and progression are core clues for narrowing differential diagnosis.",
    confidence: 95,
    tags: ["onset", "timeline"],
  },
  {
    question: "What were you doing when the symptoms began?",
    category: "History",
    importance: "medium",
    rationale: "Context at onset can point toward triggers or mechanism of illness.",
    confidence: 88,
    tags: ["context", "onset"],
  },
  {
    question: "What makes the symptoms better or worse?",
    category: "History",
    importance: "medium",
    rationale: "Aggravating and relieving factors often indicate likely etiology.",
    confidence: 88,
    tags: ["triggers", "relief"],
  },
  {
    question: "Have you noticed any associated symptoms such as fever, weight loss, or night sweats?",
    category: "History",
    importance: "high",
    rationale: "Red-flag associated symptoms change urgency and differential breadth.",
    confidence: 91,
    tags: ["associated", "red-flags"],
  },
  {
    question: "Do you have any past medical conditions, medications, or allergies I should know about?",
    category: "History",
    importance: "high",
    rationale: "Comorbidities and medications strongly influence diagnosis and management.",
    confidence: 94,
    tags: ["pmh", "medications", "allergies"],
  },
  {
    question: "Is there any family history of similar or related conditions?",
    category: "History",
    importance: "medium",
    rationale: "Family history informs genetic and risk-based differentials.",
    confidence: 82,
    tags: ["family", "genetics"],
  },
  {
    question: "Can you describe how severe your main symptom is right now on a 0–10 scale?",
    category: "Assessment",
    importance: "high",
    rationale: "Severity helps risk-stratify the case and guide urgency.",
    confidence: 92,
    tags: ["severity", "pain-scale"],
  },
  {
    question: "How is this affecting your sleep, work, or daily activities?",
    category: "Assessment",
    importance: "medium",
    rationale: "Functional impact reflects severity and guides disposition.",
    confidence: 86,
    tags: ["function", "impact"],
  },
  {
    question: "Have you tried anything at home for relief, and did it help?",
    category: "Assessment",
    importance: "medium",
    rationale: "Prior self-care reveals what has been ruled out or partially treated.",
    confidence: 84,
    tags: ["self-care", "treatment-trial"],
  },
  {
    question: "Have you had similar episodes before, and how were they evaluated or treated?",
    category: "Impact",
    importance: "medium",
    rationale: "Recurrence patterns refine chronicity and prior workup.",
    confidence: 84,
    tags: ["recurrence", "prior-care"],
  },
  {
    question: "Have you traveled recently or been exposed to anyone who is ill?",
    category: "History",
    importance: "medium",
    rationale: "Exposure history supports infectious or environmental causes.",
    confidence: 80,
    tags: ["exposure", "travel"],
  },
  {
    question: "Do you smoke, drink alcohol, or use any recreational substances?",
    category: "History",
    importance: "medium",
    rationale: "Social history affects many pulmonary, cardiac, and GI presentations.",
    confidence: 83,
    tags: ["social", "substances"],
  },
  {
    question: "Any recent changes in appetite, bowel habits, or urinary symptoms?",
    category: "Assessment",
    importance: "medium",
    rationale: "System review catches related organ systems not yet explored.",
    confidence: 85,
    tags: ["review-of-systems"],
  },
  {
    question: "Are you experiencing any chest pain, shortness of breath, or dizziness?",
    category: "Assessment",
    importance: "high",
    rationale: "Screening critical associated symptoms supports safe triage.",
    confidence: 90,
    tags: ["cardiopulmonary", "safety"],
  },
  {
    question: "What is your biggest concern about these symptoms today?",
    category: "Impact",
    importance: "high",
    rationale: "Patient concerns guide shared decision-making and counseling.",
    confidence: 87,
    tags: ["ice", "concerns"],
  },
]

function personalizeQuestion(template: string, context: ConversationContext): string {
  const symptom = (context.symptoms?.[0] || "your symptoms").toLowerCase()
  return template
    .replace(/\{symptom\}/gi, symptom)
    .replace(/your main symptom/gi, symptom)
}

function selectFromPool(context: ConversationContext): SuggestedQuestion[] {
  const studentMessages = (context.conversationHistory ?? [])
    .filter((m) => m.role === "student")
    .map((m) => m.content)

  const turn = studentMessages.length
  const available = QUESTION_POOL.map((q) => ({
    ...q,
    question: personalizeQuestion(q.question, context),
  })).filter((q) => !wasAlreadyAsked(q.question, studentMessages))

  const pool =
    available.length >= 5
      ? available
      : [
          ...available,
          ...QUESTION_POOL.map((q) => ({
            ...q,
            question: personalizeQuestion(q.question, context),
          })).filter(
            (q) => !available.some((a) => a.question === q.question),
          ),
        ]

  const rotated = [...pool].sort((a, b) => {
    const ha = (turn + a.question.length + a.category.length) % 997
    const hb = (turn + b.question.length + b.category.length) % 997
    return ha - hb
  })

  return rotated.slice(0, 5).map((q, index) => ({
    ...q,
    id: `t${turn}-${index}`,
    confidence: Math.max(75, (q.confidence ?? 85) - index * 2),
  }))
}

async function generateWithLlm(context: ConversationContext): Promise<SuggestedQuestion[] | null> {
  const hasKey = Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY)
  if (!hasKey) return null

  const transcript = (context.conversationHistory ?? [])
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")
  const asked = (context.conversationHistory ?? [])
    .filter((m) => m.role === "student")
    .map((m) => `- ${m.content}`)
    .join("\n")

  const schema = `Return ONLY JSON: { "questions": [ { "id":"1", "question":"...", "category":"History|Assessment|Impact|Symptoms|Examination", "importance":"high|medium|low", "rationale":"...", "confidence":85, "tags":["tag"] } ] }`

  try {
    const text = await runNewGemini(
      BEST_GEMINI_MODEL,
      "You are a clinical educator suggesting the next best patient interview questions for a medical student. Never repeat questions already asked. Output valid JSON only.",
      `${schema}

Case specialty: ${context.specialty}
Presenting context (educator only): ${context.diseaseName || context.disease}
Symptoms: ${(context.symptoms ?? []).join(", ")}

Already asked by student:
${asked || "(none yet)"}

Full transcript:
${transcript || "(no messages yet)"}

Suggest exactly 5 NEW questions that logically follow the conversation so far.`,
      false,
      0,
      false,
      0.35,
      2048,
    )
    const parsed = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim()) as {
      questions?: SuggestedQuestion[]
    }
    if (!Array.isArray(parsed.questions) || !parsed.questions.length) return null
    return parsed.questions.slice(0, 5).map((q, i) => ({
      id: String(q.id ?? `llm-${i}`),
      question: String(q.question ?? "").trim(),
      category: String(q.category ?? "History"),
      importance: (q.importance as SuggestedQuestion["importance"]) || "medium",
      rationale: String(q.rationale ?? "Follow-up based on the encounter so far."),
      confidence: typeof q.confidence === "number" ? q.confidence : 85,
      tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
    }))
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    hydrateGeminiApiKeyFromBackendEnv()
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const context: ConversationContext | undefined = body?.context
    if (!context) {
      return res.status(400).json({ error: "context is required" })
    }

    const studentMessages = (context.conversationHistory ?? [])
      .filter((m) => m.role === "student")
      .map((m) => m.content)

    const llmQuestions = await generateWithLlm(context)
    const filteredLlm = llmQuestions?.filter(
      (q) => q.question && !wasAlreadyAsked(q.question, studentMessages),
    )
    const questions =
      filteredLlm && filteredLlm.length >= 3
        ? filteredLlm.slice(0, 5)
        : selectFromPool(context)

    return res.status(200).json({
      questions,
      source: filteredLlm && filteredLlm.length >= 3 ? "llm" : "pool",
    })
  } catch (error) {
    console.error("Error generating suggested questions:", error)
    return res.status(500).json({ error: "Failed to generate suggested questions" })
  }
}
