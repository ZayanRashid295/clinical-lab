import type { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

type Message = { role: string; content: string }

function hydrateGeminiApiKeyFromBackendEnv() {
  if (
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY
  ) {
    return
  }

  const backendEnvPath = path.resolve(process.cwd(), "../backend/.env")
  if (!fs.existsSync(backendEnvPath)) return

  const backendEnv = fs.readFileSync(backendEnvPath, "utf8")
  const geminiKeyMatch = backendEnv.match(/^(?:GOOGLE_API_KEY|GEMINI_API_KEY)\s*=\s*("?)(.*?)\1\s*$/m)
  if (!geminiKeyMatch?.[2]) return

  process.env.GOOGLE_API_KEY = geminiKeyMatch[2]
}

function normalizePrompt(messages: Message[]) {
  const systemMessage = messages.find((m) => m.role === "system")
  const nonSystemMessages = messages.filter((m) => m.role !== "system")

  return systemMessage
    ? `${systemMessage.content}\n\n${nonSystemMessages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n")}`
    : nonSystemMessages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    hydrateGeminiApiKeyFromBackendEnv()

    const apiKey =
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: "Missing Gemini API key." })
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    const { model, messages, maxTokens = 256, temperature = 0.7 } = body || {}

    if (!model || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "model and messages are required" })
    }

    const prompt = normalizePrompt(messages)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    )

    if (!response.ok) {
      const raw = await response.text()
      return res.status(response.status).json({
        error: `Gemini API error: ${response.status} ${response.statusText}`,
        details: raw,
      })
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return res.status(500).json({ error: "Gemini API returned an empty response." })
    }

    return res.status(200).json({ text })
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ error: "Failed to generate evaluation response", details })
  }
}
