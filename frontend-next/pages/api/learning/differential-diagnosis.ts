import type { NextApiRequest, NextApiResponse } from "next"
import { hydrateGeminiApiKeyFromBackendEnv } from "@/lib/api/hydrate-gemini-from-backend-env"
import { handleDifferentialDiagnosis } from "@/lib/medprep-shadow/shadow-llm-handlers"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    hydrateGeminiApiKeyFromBackendEnv()
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const diagnosis = await handleDifferentialDiagnosis(body)
    return res.status(200).json({ diagnosis, degraded: false })
  } catch (e) {
    console.error("differential-diagnosis:", e)
    // Degraded empty list — client keeps prior DD instead of crashing
    return res.status(200).json({ diagnosis: [], degraded: true })
  }
}
