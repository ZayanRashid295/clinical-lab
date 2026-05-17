import type { NextApiRequest, NextApiResponse } from "next"
import { hydrateGeminiApiKeyFromBackendEnv } from "@/lib/api/hydrate-gemini-from-backend-env"
import { handleNurseReport } from "@/lib/medprep-shadow/shadow-llm-handlers"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    hydrateGeminiApiKeyFromBackendEnv()
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const report = await handleNurseReport(body)
    return res.status(200).json(report)
  } catch (e) {
    console.error("nurse-report:", e)
    return res.status(500).json({ error: "Failed to generate nurse report" })
  }
}
