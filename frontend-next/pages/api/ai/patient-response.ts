import type { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import { aiService } from "@/lib/fyp/ai-service"
import type { ConversationContext } from "@/lib/fyp/data-models"

function hydrateGeminiApiKeyFromBackendEnv() {
  if (
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY
  ) {
    return
  }

  const backendEnvPath = path.resolve(process.cwd(), "../backend/.env")
  if (!fs.existsSync(backendEnvPath)) return

  const backendEnv = fs.readFileSync(backendEnvPath, "utf8")
  const geminiKeyMatch = backendEnv.match(
    /^(?:GOOGLE_API_KEY|GEMINI_API_KEY)\s*=\s*("?)(.*?)\1\s*$/m
  )
  if (!geminiKeyMatch?.[2]) return

  process.env.GOOGLE_API_KEY = geminiKeyMatch[2]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    hydrateGeminiApiKeyFromBackendEnv()
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const { studentQuestion, context }: { studentQuestion: string; context: ConversationContext } = body || {}

    if (!studentQuestion || !context) {
      return res.status(400).json({ error: "studentQuestion and context are required" })
    }

    const response = await aiService.generatePatientResponse(studentQuestion, context)
    return res.status(200).json(response)
  } catch (error) {
    console.error("Error generating patient response:", error)
    const details = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ error: "Failed to generate patient response", details })
  }
}
