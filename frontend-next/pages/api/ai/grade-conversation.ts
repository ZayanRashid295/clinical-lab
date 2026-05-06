import type { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import { aiService } from "@/lib/fyp/ai-service"

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
  const geminiKeyMatch = backendEnv.match(/^(?:GOOGLE_API_KEY|GEMINI_API_KEY)\s*=\s*("?)(.*?)\1\s*$/m)
  if (!geminiKeyMatch?.[2]) return

  process.env.GOOGLE_API_KEY = geminiKeyMatch[2]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  try {
    hydrateGeminiApiKeyFromBackendEnv()
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const { conversation, medicalCase } = body || {}
    if (!conversation || !medicalCase) {
      return res.status(400).json({ success: false, error: "Conversation and medical case are required" })
    }

    const grading = await aiService.gradeConversation(conversation, medicalCase)
    return res.status(200).json({ success: true, grading })
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ success: false, error: "Failed to grade conversation", details })
  }
}
