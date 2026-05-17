import type { NextApiRequest, NextApiResponse } from "next"
import { MedprepBackendRequestError, medprepBackendRequest } from "@/lib/fyp/backend-medprep-api"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined
    const mode = typeof req.query.mode === "string" ? req.query.mode : undefined
    const caseId = typeof req.query.caseId === "string" ? req.query.caseId : undefined

    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" })
    }
    if (!mode) {
      return res.status(400).json({ success: false, error: "mode is required" })
    }

    const q = new URLSearchParams({ mode })
    if (caseId) q.set("caseId", caseId)

    const session = await medprepBackendRequest<unknown>(
      `/medprep-ai/sessions/resume?${q.toString()}`,
      { userId },
    )

    return res.status(200).json({ success: true, session: session ?? null })
  } catch (e) {
    if (MedprepBackendRequestError.is(e) && e.status === 404) {
      return res.status(200).json({ success: true, session: null })
    }
    const details = e instanceof Error ? e.message : "Unknown error"
    return res.status(500).json({ success: false, error: "Failed to resume session", details })
  }
}
