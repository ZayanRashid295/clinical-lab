import type { NextApiRequest, NextApiResponse } from "next"
import { medprepBackendRequest } from "@/lib/fyp/backend-medprep-api"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  try {
    const soapNote = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const userId = soapNote?.studentId || soapNote?.userId
    if (!userId || !soapNote?.conversationId) {
      return res
        .status(400)
        .json({ success: false, error: "conversationId and userId are required" })
    }
    await medprepBackendRequest(`/medprep-ai/sessions/${soapNote.conversationId}/soap`, {
      method: "PUT",
      userId,
      body: {
        subjective: soapNote.subjective,
        objective: soapNote.objective,
        assessment: soapNote.assessment,
        plan: soapNote.plan,
        aiSubjective: soapNote.aiGeneratedSOAP?.subjective,
        aiObjective: soapNote.aiGeneratedSOAP?.objective,
        aiAssessment: soapNote.aiGeneratedSOAP?.assessment,
        aiPlan: soapNote.aiGeneratedSOAP?.plan,
        grade: soapNote.grade,
        feedback: soapNote.feedback,
      },
    })
    if (soapNote.grade != null) {
      await medprepBackendRequest(`/medprep-ai/sessions/${soapNote.conversationId}/soap/submit`, {
        method: "POST",
        userId,
        body: { grade: soapNote.grade, feedback: soapNote.feedback },
      })
      await medprepBackendRequest(`/medprep-ai/sessions/${soapNote.conversationId}/score`, {
        method: "POST",
        userId,
        body: { score: soapNote.grade, feedback: soapNote.feedback },
      })
    }
    return res.status(200).json({ success: true, data: soapNote })
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ success: false, error: "Failed to save SOAP note", details })
  }
}
