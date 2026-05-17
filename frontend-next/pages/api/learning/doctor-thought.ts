import type { NextApiRequest, NextApiResponse } from "next"
import { hydrateGeminiApiKeyFromBackendEnv } from "@/lib/api/hydrate-gemini-from-backend-env"
import { handleDoctorThought } from "@/lib/medprep-shadow/shadow-llm-handlers"

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
    const out = await handleDoctorThought(body)
    return res.status(200).json({ ...out, fullResponse: out.raw })
  } catch (e) {
    console.error("doctor-thought:", e)
    return res.status(500).json({ error: "Failed to generate doctor thought" })
  }
}
