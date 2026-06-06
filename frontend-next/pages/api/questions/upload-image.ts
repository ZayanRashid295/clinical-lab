import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Proxy multipart image uploads to Nest on localhost.
 * Next.js Pages API default bodyParser limit is 1MB (413) — disabled here; body is streamed.
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

function getBackendBaseUrl(): string {
  const internal = process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "");
  if (internal) return internal;

  const publicApi = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (publicApi) {
    return publicApi.replace(/\/api$/i, "");
  }

  return "http://127.0.0.1:3000";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const backendUrl = `${getBackendBaseUrl()}/questions/upload-image`;

  try {
    const headers: Record<string, string> = {};
    const auth = req.headers.authorization;
    const contentType = req.headers["content-type"];
    if (typeof auth === "string") headers.Authorization = auth;
    if (typeof contentType === "string") headers["Content-Type"] = contentType;

    const backendRes = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: req as unknown as BodyInit,
      // Required when streaming a request body in Node 18+ fetch
      // @ts-expect-error Node fetch duplex option
      duplex: "half",
    });

    const responseText = await backendRes.text();
    const responseType = backendRes.headers.get("content-type");
    if (responseType) res.setHeader("Content-Type", responseType);

    if (!backendRes.ok) {
      let message = `Failed to upload image: ${backendRes.status}`;
      try {
        const parsed = JSON.parse(responseText) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        /* non-JSON error body */
      }
      return res.status(backendRes.status).json({ message });
    }

    try {
      return res.status(backendRes.status).json(JSON.parse(responseText));
    } catch {
      return res.status(500).json({ message: "Invalid response from upload service" });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload proxy failed";
    console.error("[upload-image proxy]", message);
    return res.status(502).json({ message });
  }
}
