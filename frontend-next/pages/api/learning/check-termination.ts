import type { NextApiRequest, NextApiResponse } from "next"
import { hydrateGeminiApiKeyFromBackendEnv } from "@/lib/api/hydrate-gemini-from-backend-env"
import { handleCheckTermination } from "@/lib/medprep-shadow/shadow-llm-handlers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    hydrateGeminiApiKeyFromBackendEnv()
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const out = await handleCheckTermination(body)
    return res.status(200).json(out)
  } catch (e) {
    console.error("check-termination:", e)
    return res.status(500).json({
      success: false,
      shouldTerminate: false,
      diagnosticClarity: "insufficient",
      reasoning: "Unable to evaluate termination; continuing session.",
      confidence: 0.2,
    })
  }
}
