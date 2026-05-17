import type { NextApiRequest, NextApiResponse } from "next"
import { medprepBackendRequest } from "@/lib/fyp/backend-medprep-api"
import { parseNextJsonBody } from "@/lib/api/parse-json-body"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"])
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  try {
    const parsed = parseNextJsonBody(req.body)
    if (!parsed.ok) {
      return res.status(400).json({ success: false, error: "INVALID_JSON", message: parsed.error })
    }
    const body = parsed.data as Record<string, unknown>
    const userId = typeof body.userId === "string" ? body.userId : undefined
    const conversationId = typeof body.conversationId === "string" ? body.conversationId : undefined
    const sessionKey = typeof body.sessionKey === "string" ? body.sessionKey : undefined

    if (!userId || !conversationId || !sessionKey) {
      return res.status(400).json({
        success: false,
        error: "userId, conversationId, and sessionKey are required",
      })
    }

    const hintSession = await medprepBackendRequest(`/medprep-ai/sessions/${conversationId}/hints`, {
      method: "PUT",
      userId,
      body: {
        sessionKey,
        caseId: body.caseId,
        totalHintsUsed: body.totalHintsUsed ?? 0,
        highImportanceHints: body.highImportanceHints ?? 0,
        mediumImportanceHints: body.mediumImportanceHints ?? 0,
        lowImportanceHints: body.lowImportanceHints ?? 0,
        gradePenalty: body.gradePenalty ?? 0,
        hintTimestamps: body.hintTimestamps,
        hintsByCategory: body.hintsByCategory,
      },
    })

    return res.status(200).json({ success: true, hintSession })
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ success: false, error: "Failed to save hint session", details })
  }
}
