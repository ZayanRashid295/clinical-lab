import type { NextApiRequest, NextApiResponse } from "next"
import type { ConversationContext } from "@/lib/fyp/data-models"

interface SuggestedQuestion {
  id: string
  question: string
  category: string
  importance: "high" | "medium" | "low"
  rationale: string
  confidence: number
  tags: string[]
}

function generateSuggestedQuestions(context: ConversationContext): SuggestedQuestion[] {
  const symptom = context.symptoms[0] || "your symptoms"
  return [
    {
      id: "1",
      question: "When did these symptoms first start, and were they sudden or gradual?",
      category: "History",
      importance: "high",
      rationale: "Symptom onset and progression are core clues for narrowing differential diagnosis.",
      confidence: 95,
      tags: ["onset", "timeline"],
    },
    {
      id: "2",
      question: `Can you describe how severe your ${symptom.toLowerCase()} is right now?`,
      category: "Assessment",
      importance: "high",
      rationale: "Severity helps risk-stratify the case and guide urgency.",
      confidence: 92,
      tags: ["severity", "risk"],
    },
    {
      id: "3",
      question: "What makes the symptoms better or worse?",
      category: "History",
      importance: "medium",
      rationale: "Aggravating and relieving factors often indicate likely etiology.",
      confidence: 88,
      tags: ["triggers", "relief"],
    },
    {
      id: "4",
      question: "Do you have any past medical conditions, medications, or allergies I should know about?",
      category: "History",
      importance: "high",
      rationale: "Comorbidities and medications strongly influence both diagnosis and management.",
      confidence: 94,
      tags: ["pmh", "medications", "allergies"],
    },
    {
      id: "5",
      question: "Have you had similar episodes before, and how were they treated?",
      category: "Impact",
      importance: "medium",
      rationale: "Recurrence patterns and prior response to care can refine diagnostic thinking.",
      confidence: 84,
      tags: ["recurrence", "treatment-history"],
    },
  ]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const context: ConversationContext | undefined = body?.context
    if (!context) {
      return res.status(400).json({ error: "context is required" })
    }

    return res.status(200).json({ questions: generateSuggestedQuestions(context) })
  } catch (error) {
    console.error("Error generating suggested questions:", error)
    return res.status(500).json({ error: "Failed to generate suggested questions" })
  }
}
