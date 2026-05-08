import type { NextApiRequest, NextApiResponse } from "next"
import { medprepBackendRequest } from "@/lib/fyp/backend-medprep-api"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.conversationId
  if (typeof id !== "string") {
    return res.status(400).json({ success: false, error: "Invalid conversation id" })
  }

  const userId =
    typeof req.query.userId === "string"
      ? req.query.userId
      : typeof req.headers["x-user-id"] === "string"
        ? req.headers["x-user-id"]
        : undefined

  if (req.method === "GET") {
    try {
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required" })
      }
      const conversation = await medprepBackendRequest<any>(`/medprep-ai/sessions/${id}`, {
        userId,
      })
      return res.status(200).json({ success: true, conversation })
    } catch (e) {
      console.error("[api/conversations/:id] GET error", e)
      return res.status(404).json({ success: false, error: "Conversation not found" })
    }
  }

  if (req.method === "PUT") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
      const localUserId = userId || body?.userId
      if (!localUserId) {
        return res.status(400).json({ success: false, error: "userId is required" })
      }
      const status = (body as { status?: string }).status
      const conversation = await medprepBackendRequest<any>(`/medprep-ai/sessions/${id}`, {
        method: "PATCH",
        userId: localUserId,
        body: {
          status,
        },
      })
      return res.status(200).json({ success: true, conversation })
    } catch (e) {
      console.error("[api/conversations/:id] PUT error", e)
      return res.status(500).json({ success: false, error: "Failed to update conversation" })
    }
  }

  res.setHeader("Allow", "GET, PUT")
  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` })
}
