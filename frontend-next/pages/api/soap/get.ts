import type { NextApiRequest, NextApiResponse } from "next"
import { soapService } from "@/lib/fyp/soap-service"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  try {
    const conversationId = typeof req.query.conversationId === "string" ? req.query.conversationId : ""
    if (!conversationId) {
      return res.status(400).json({ success: false, error: "Conversation ID is required" })
    }
    const soapNote = await soapService.getSOAPNoteByConversation(conversationId)
    return res.status(200).json({ success: true, soapNote })
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ success: false, error: "Failed to get SOAP note", details })
  }
}
