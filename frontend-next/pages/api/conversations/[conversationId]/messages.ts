import type { NextApiRequest, NextApiResponse } from "next"
import { type MedprepMessageRole } from "@/lib/fyp/medprep-conversation-memory-store"
import { medprepBackendRequest } from "@/lib/fyp/backend-medprep-api"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const conversationId = req.query.conversationId
  if (typeof conversationId !== "string") {
    return res.status(400).json({ success: false, error: "Invalid conversation id" })
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` })
  }

  const userId =
    typeof req.query.userId === "string"
      ? req.query.userId
      : typeof req.headers["x-user-id"] === "string"
        ? req.headers["x-user-id"]
        : undefined

  try {
    let body: unknown = req.body
    if (typeof body === "string") {
      try {
        body = JSON.parse(body)
      } catch {
        return res.status(400).json({ success: false, error: "INVALID_JSON", message: "Invalid JSON body" })
      }
    }
    const { role, content, isIntervention, relevanceScore, metadata } = body as {
      role?: MedprepMessageRole | string
      content?: string
      isIntervention?: boolean
      relevanceScore?: number
      metadata?: Record<string, unknown>
    }

    if (!role || !content) {
      return res.status(400).json({ success: false, error: "role and content are required" })
    }

    const normalizedRole = String(role).toUpperCase() as MedprepMessageRole
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" })
    }
    const message = await medprepBackendRequest<any>(
      `/medprep-ai/sessions/${conversationId}/messages`,
      {
        method: "POST",
        userId,
        timeoutMs: 30_000,
        body: {
          role: normalizedRole,
          content,
          isIntervention: Boolean(isIntervention),
          relevanceScore,
          metadata,
        },
      }
    )

    return res.status(200).json({ success: true, message })
  } catch (e) {
    console.error("[api/conversations/.../messages] POST error", e)
    return res.status(500).json({ success: false, error: "Failed to add message" })
  }
}
