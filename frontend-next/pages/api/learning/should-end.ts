import type { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import { learningService } from "@/lib/fyp/learning-service"
import { parseNextJsonBody } from "@/lib/api/parse-json-body"

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
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    hydrateGeminiApiKeyFromBackendEnv()
    const parsed = parseNextJsonBody(req.body)
    if (!parsed.ok) {
      return res.status(400).json({ error: "INVALID_JSON", message: parsed.error })
    }
    const conversation = Array.isArray(parsed.data.conversation) ? parsed.data.conversation : []
    const disease =
      typeof parsed.data.disease === "string" ? parsed.data.disease : "Unknown"
    const result = await learningService.shouldEndConversation(conversation, disease)
    return res.status(200).json(result)
  } catch {
    return res.status(500).json({ error: "Failed to evaluate conversation completion" })
  }
}
