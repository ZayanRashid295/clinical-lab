import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";

/**
 * Proxy multipart image uploads to Nest on localhost.
 * Browser → nginx → Next (this route) → Nest on 127.0.0.1:3000
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

function getBackendBaseUrl(): string {
  const internal = process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "");
  if (internal) return internal;

  const port = process.env.BACKEND_PORT || "3000";
  return `http://127.0.0.1:${port}`;
}

async function readRequestBody(req: NextApiRequest): Promise<Buffer> {
  const readable = req as unknown as Readable;
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    readable.on("data", (chunk: Buffer | string) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const backendUrl = `${getBackendBaseUrl()}/questions/upload-image`;

  try {
    const body = await readRequestBody(req);
    const headers: Record<string, string> = {};
    const auth = req.headers.authorization;
    const contentType = req.headers["content-type"];
    if (typeof auth === "string") headers.Authorization = auth;
    if (typeof contentType === "string") headers["Content-Type"] = contentType;

    const backendRes = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: new Uint8Array(body),
    });

    const responseText = await backendRes.text();

    if (!backendRes.ok) {
      let message = `Failed to upload image: ${backendRes.status}`;
      try {
        const parsed = JSON.parse(responseText) as { message?: string | string[] };
        if (typeof parsed.message === "string") message = parsed.message;
        else if (Array.isArray(parsed.message)) message = parsed.message.join(", ");
      } catch {
        if (responseText.trim()) {
          console.error("[upload-image proxy] backend error body:", responseText.slice(0, 500));
        }
      }
      return res.status(backendRes.status).json({ message });
    }

    if (!responseText.trim()) {
      console.error("[upload-image proxy] empty success body from", backendUrl);
      return res.status(502).json({ message: "Upload service returned an empty response" });
    }

    try {
      const data = JSON.parse(responseText) as { url?: string };
      if (!data.url) {
        console.error("[upload-image proxy] missing url in response:", responseText.slice(0, 500));
        return res.status(502).json({ message: "Upload service did not return an image URL" });
      }
      return res.status(backendRes.status).json(data);
    } catch {
      console.error(
        "[upload-image proxy] non-JSON success from",
        backendUrl,
        responseText.slice(0, 500)
      );
      return res.status(502).json({
        message: "Invalid response from upload service. Check BACKEND_INTERNAL_URL points to Nest (http://127.0.0.1:3000).",
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload proxy failed";
    console.error("[upload-image proxy]", backendUrl, message);
    return res.status(502).json({ message: `Upload proxy failed: ${message}` });
  }
}
