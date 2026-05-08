import type { NextApiRequest, NextApiResponse } from "next"
import { medprepBackendRequest } from "@/lib/fyp/backend-medprep-api"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  try {
    const conversationId = typeof req.query.conversationId === "string" ? req.query.conversationId : ""
    const userId =
      typeof req.query.userId === "string"
        ? req.query.userId
        : typeof req.headers["x-user-id"] === "string"
          ? req.headers["x-user-id"]
          : ""
    if (!conversationId) {
      return res.status(400).json({ success: false, error: "Conversation ID is required" })
    }
    const session = await medprepBackendRequest<any>(`/medprep-ai/sessions/${conversationId}`, {
      userId: userId || undefined,
    })
    const latestSoap = session?.soapNotes?.[0]
    const soapNote = latestSoap
      ? {
          id: latestSoap.id,
          conversationId: latestSoap.conversationId,
          studentId: latestSoap.userId,
          subjective: latestSoap.subjective,
          objective: latestSoap.objective,
          assessment: latestSoap.assessment,
          plan: latestSoap.plan,
          aiGeneratedSOAP: {
            subjective: latestSoap.aiSubjective || "",
            objective: latestSoap.aiObjective || "",
            assessment: latestSoap.aiAssessment || "",
            plan: latestSoap.aiPlan || "",
          },
          submittedAt: latestSoap.submittedAt || latestSoap.lastSavedAt,
        }
      : null
    return res.status(200).json({ success: true, soapNote })
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ success: false, error: "Failed to get SOAP note", details })
  }
}
