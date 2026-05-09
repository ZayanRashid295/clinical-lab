import type { NextApiRequest, NextApiResponse } from "next"
import { medprepBackendRequest } from "@/lib/fyp/backend-medprep-api"
import { parseNextJsonBody } from "@/lib/api/parse-json-body"

function inferErrorStatus(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err)
  if (/timed out/i.test(msg)) return 504
  if (/Backend request failed \(404\)/i.test(msg) || /not found/i.test(msg)) return 404
  if (/403|forbidden|not yours/i.test(msg)) return 403
  if (/400|required|bad request/i.test(msg)) return 400
  return 502
}

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
      const status = inferErrorStatus(e)
      const clientMsg =
        status === 404 ? "Conversation not found" : status === 403 ? "Forbidden" : "Failed to load conversation"
      return res.status(status).json({ success: false, error: clientMsg })
    }
  }

  if (req.method === "PUT") {
    try {
      const parsed = parseNextJsonBody(req.body)
      if (!parsed.ok) {
        return res.status(400).json({ success: false, error: "INVALID_JSON", message: parsed.error })
      }
      const body = parsed.data
      const localUserId = userId || (typeof body.userId === "string" ? body.userId : undefined)
      if (!localUserId) {
        return res.status(400).json({ success: false, error: "userId is required" })
      }
      const status = typeof body.status === "string" ? body.status : undefined
      const metadata =
        body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
          ? (body.metadata as Record<string, unknown>)
          : undefined
      const score = typeof body.score === "number" ? body.score : undefined
      const conversation = await medprepBackendRequest<any>(`/medprep-ai/sessions/${id}`, {
        method: "PATCH",
        userId: localUserId,
        body: {
          status,
          metadata,
          score,
        },
      })
      return res.status(200).json({ success: true, conversation })
    } catch (e) {
      console.error("[api/conversations/:id] PUT error", e)
      const status = inferErrorStatus(e)
      return res
        .status(status >= 400 && status < 600 ? status : 500)
        .json({ success: false, error: "Failed to update conversation" })
    }
  }

  res.setHeader("Allow", "GET, PUT")
  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` })
}
