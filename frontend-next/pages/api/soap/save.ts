import type { NextApiRequest, NextApiResponse } from "next"
import { soapService } from "@/lib/fyp/soap-service"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  try {
    const soapNote = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    await soapService.saveSOAPNote(soapNote)
    return res.status(200).json({ success: true, data: soapNote })
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ success: false, error: "Failed to save SOAP note", details })
  }
}
