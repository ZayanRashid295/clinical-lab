import type { NextApiRequest, NextApiResponse } from "next"
import {
  newMedprepId,
  type MedprepMessageRole,
} from "@/lib/fyp/medprep-conversation-memory-store"
import { getConversationById, upsertConversation } from "@/lib/fyp/server-medprep-db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const conversationId = req.query.conversationId
  if (typeof conversationId !== "string") {
    return res.status(400).json({ success: false, error: "Invalid conversation id" })
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` })
  }

  const conv = await getConversationById(conversationId)
  if (!conv) {
    return res.status(404).json({ success: false, error: "Conversation not found" })
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const { role, content, isIntervention, relevanceScore } = body as {
      role?: MedprepMessageRole | string
      content?: string
      isIntervention?: boolean
      relevanceScore?: number
    }

    if (!role || !content) {
      return res.status(400).json({ success: false, error: "role and content are required" })
    }

    const normalizedRole = String(role).toUpperCase() as MedprepMessageRole
    const msgId = newMedprepId("msg")
    const createdAt = new Date().toISOString()
    const message = {
      id: msgId,
      role: normalizedRole,
      content,
      isIntervention: Boolean(isIntervention),
      relevanceScore,
      createdAt,
    }
    conv.messages.push(message)
    if (normalizedRole === "DOCTOR" && isIntervention) {
      conv.interventionCount += 1
    }
    await upsertConversation(conv)

    return res.status(200).json({ success: true, message })
  } catch (e) {
    console.error("[api/conversations/.../messages] POST error", e)
    return res.status(500).json({ success: false, error: "Failed to add message" })
  }
}
