import type { NextApiRequest, NextApiResponse } from "next"
import { hydrateGeminiApiKeyFromBackendEnv } from "@/lib/api/hydrate-gemini-from-backend-env"
import { handleAiSupervisor } from "@/lib/medprep-shadow/shadow-llm-handlers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    hydrateGeminiApiKeyFromBackendEnv()
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const out = await handleAiSupervisor(body)
    return res.status(200).json({ ...out, timestamp: new Date().toISOString() })
  } catch (e) {
    console.error("ai-supervisor:", e)
    return res.status(200).json({
      evaluation: {
        content: "Continue with your assessment.",
        confidence: 0.5,
        shouldIntervene: false,
      },
      timestamp: new Date().toISOString(),
    })
  }
}
