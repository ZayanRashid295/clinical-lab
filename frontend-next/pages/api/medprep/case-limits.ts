import type { NextApiRequest, NextApiResponse } from "next";
import { medprepBackendRequest } from "@/lib/fyp/backend-medprep-api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const data = await medprepBackendRequest<unknown>("/medprep-ai/me/case-limits", {
      userId,
    });
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error("[api/medprep/case-limits]", e);
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : "Failed to load case limits",
    });
  }
}
