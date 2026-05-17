import type { NextApiRequest, NextApiResponse } from "next"
import { MedprepBackendRequestError, medprepBackendRequest } from "@/lib/fyp/backend-medprep-api"
import { parseNextJsonBody } from "@/lib/api/parse-json-body"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const parsed = parseNextJsonBody(req.body)
      if (!parsed.ok) {
        return res.status(400).json({ success: false, error: "INVALID_JSON", message: parsed.error })
      }
      const body = parsed.data
      const userId = typeof body.userId === "string" ? body.userId : undefined
      const rawCaseId = body.caseId
      const caseId =
        rawCaseId != null && String(rawCaseId).trim() !== ""
          ? String(rawCaseId).trim()
          : undefined
      const caseInstanceId = typeof body.caseInstanceId === "string" ? body.caseInstanceId : undefined
      const mode =
        (body.mode as "PRACTICE" | "LEARNING" | "EVALUATION" | "SHADOW" | undefined) || "PRACTICE"
      const caseTitle = typeof body.caseTitle === "string" ? body.caseTitle : undefined
      const caseSnapshot =
        body.caseSnapshot && typeof body.caseSnapshot === "object" && !Array.isArray(body.caseSnapshot)
          ? (body.caseSnapshot as Record<string, unknown>)
          : undefined
      const isGeneratedCase =
        typeof body.isGeneratedCase === "boolean" ? body.isGeneratedCase : undefined
      const metadata =
        body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
          ? (body.metadata as Record<string, unknown>)
          : undefined
      if (!userId || !caseId) {
        return res.status(400).json({
          success: false,
          error: "userId and caseId are required",
        })
      }
      const conversation = await medprepBackendRequest<any>("/medprep-ai/sessions", {
        method: "POST",
        userId,
        body: {
          mode,
          caseId,
          caseInstanceId,
          title: caseTitle,
          ...(caseSnapshot ? { caseSnapshot } : {}),
          ...(isGeneratedCase !== undefined ? { isGeneratedCase } : {}),
          ...(metadata ? { metadata } : {}),
        },
      })
      return res.status(200).json({ success: true, conversation })
    } catch (e) {
      if (MedprepBackendRequestError.is(e)) {
        const code =
          e.status === 403
            ? "FORBIDDEN"
            : e.status === 401
              ? "UNAUTHORIZED"
              : "MEDPREP_BACKEND_ERROR"
        return res.status(e.status).json({
          success: false,
          error: code,
          message: e.message,
          ...(typeof e.payload === "object" && e.payload !== null ? e.payload : {}),
        })
      }
      console.error("[api/conversations] POST error", e)
      return res.status(500).json({ success: false, error: "Failed to create conversation" })
    }
  }

  if (req.method === "GET") {
    try {
      const userId = typeof req.query.userId === "string" ? req.query.userId : undefined
      const caseId = typeof req.query.caseId === "string" ? req.query.caseId : undefined
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required" })
      }
      const query = new URLSearchParams()
      if (caseId) query.set("caseId", caseId)
      const mode = typeof req.query.mode === "string" ? req.query.mode : undefined
      if (mode) query.set("mode", mode)
      const status = typeof req.query.status === "string" ? req.query.status : undefined
      if (status) query.set("status", status)
      const summary = typeof req.query.summary === "string" ? req.query.summary : undefined
      if (summary) query.set("summary", summary)
      const qs = query.toString()
      const conversations = await medprepBackendRequest<any[]>(
        `/medprep-ai/sessions${qs ? `?${qs}` : ""}`,
        { userId }
      )
      return res.status(200).json({ success: true, conversations })
    } catch (e) {
      if (MedprepBackendRequestError.is(e)) {
        return res.status(e.status).json({
          success: false,
          error: "MEDPREP_BACKEND_ERROR",
          message: e.message,
          ...(typeof e.payload === "object" && e.payload !== null ? e.payload : {}),
        })
      }
      console.error("[api/conversations] GET error", e)
      return res.status(500).json({ success: false, error: "Failed to fetch conversations" })
    }
  }

  res.setHeader("Allow", "GET, POST")
  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` })
}
