import type { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import { learningService } from "@/lib/fyp/learning-service"

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
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const { disease, specialty, patientProfile, symptoms } = body || {}
    const result = await learningService.generatePatientInformation(
      disease,
      specialty,
      patientProfile,
      symptoms || []
    )
    return res.status(200).json(result)
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ error: "Failed to generate patient information", details })
  }
}
