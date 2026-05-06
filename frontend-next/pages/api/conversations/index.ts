import type { NextApiRequest, NextApiResponse } from "next"
import {
  newMedprepId,
  type MedprepStoredConversation,
} from "@/lib/fyp/medprep-conversation-memory-store"
import { listConversations, upsertConversation } from "@/lib/fyp/server-medprep-db"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
      const { userId, caseId } = body as { userId?: string; caseId?: string }
      if (!userId || !caseId) {
        return res.status(400).json({
          success: false,
          error: "userId and caseId are required",
        })
      }

      const id = newMedprepId("conv")
      const conv: MedprepStoredConversation = {
        id,
        status: "ACTIVE",
        startedAt: new Date().toISOString(),
        interventionCount: 0,
        userId,
        caseId,
        messages: [],
      }
      await upsertConversation(conv)
      return res.status(200).json({ success: true, conversation: conv })
    } catch (e) {
      console.error("[api/conversations] POST error", e)
      return res.status(500).json({ success: false, error: "Failed to create conversation" })
    }
  }

  if (req.method === "GET") {
    const all = await listConversations()
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined
    const caseId = typeof req.query.caseId === "string" ? req.query.caseId : undefined
    let list = [...all]
    if (userId) list = list.filter((c) => c.userId === userId)
    if (caseId) list = list.filter((c) => c.caseId === caseId || c.caseInstanceId === caseId)
    return res.status(200).json({ success: true, conversations: list })
  }

  res.setHeader("Allow", "GET, POST")
  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` })
}
