import type { NextApiRequest, NextApiResponse } from "next"
import { medprepBackendRequest } from "@/lib/fyp/backend-medprep-api"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const conversationId = req.query.conversationId
  const messageId = req.query.messageId
  if (typeof conversationId !== "string" || typeof messageId !== "string") {
    return res.status(400).json({ success: false, error: "Invalid conversation or message id" })
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH")
    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` })
  }

  const userId =
    typeof req.query.userId === "string"
      ? req.query.userId
      : typeof req.headers["x-user-id"] === "string"
        ? req.headers["x-user-id"]
        : undefined

  if (!userId) {
    return res.status(400).json({ success: false, error: "userId is required" })
  }

  try {
    let body: unknown = req.body
    if (typeof body === "string") {
      body = JSON.parse(body)
    }
    const { isIntervention, metadata } = (body ?? {}) as {
      isIntervention?: boolean
      metadata?: Record<string, unknown>
    }

    const message = await medprepBackendRequest<unknown>(
      `/medprep-ai/sessions/${conversationId}/messages/${messageId}`,
      {
        method: "PATCH",
        userId,
        timeoutMs: 30_000,
        body: { isIntervention, metadata },
      },
    )

    return res.status(200).json({ success: true, message })
  } catch (e) {
    console.error("[api/conversations/.../messages/:messageId] PATCH error", e)
    return res.status(500).json({ success: false, error: "Failed to update message" })
  }
}
