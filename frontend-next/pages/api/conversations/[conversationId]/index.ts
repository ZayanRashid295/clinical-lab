import type { NextApiRequest, NextApiResponse } from "next"
import { getConversationById, upsertConversation } from "@/lib/fyp/server-medprep-db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.conversationId
  if (typeof id !== "string") {
    return res.status(400).json({ success: false, error: "Invalid conversation id" })
  }

  const conv = await getConversationById(id)

  if (req.method === "GET") {
    if (!conv) {
      return res.status(404).json({ success: false, error: "Conversation not found" })
    }
    return res.status(200).json({ success: true, conversation: conv })
  }

  if (req.method === "PUT") {
    if (!conv) {
      return res.status(404).json({ success: false, error: "Conversation not found" })
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const status = (body as { status?: string }).status
    if (status === "COMPLETED") {
      conv.status = "COMPLETED"
      conv.completedAt = (body as { completedAt?: string }).completedAt || new Date().toISOString()
    }
    await upsertConversation(conv)
    return res.status(200).json({ success: true, conversation: conv })
  }

  res.setHeader("Allow", "GET, PUT")
  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` })
}
