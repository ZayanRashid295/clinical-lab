import type { NextApiRequest, NextApiResponse } from "next"
import { GoogleGenerativeAI } from "@google/generative-ai"
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

/**
 * Split system vs user text for Gemini. Avoids the old `USER:` / `ASSISTANT:` blob that
 * encouraged the model to echo role labels (e.g. "student: …") in short outputs.
 */
function extractSystemAndUser(messages: Message[]): {
  systemInstruction?: string
  userText: string
} {
  const systemInstruction = messages
    .find((m) => String(m.role || "").toLowerCase() === "system")
    ?.content?.trim()

  const others = messages.filter((m) => String(m.role || "").toLowerCase() !== "system")

  if (others.length === 0) {
    return { systemInstruction: systemInstruction || undefined, userText: "" }
  }

  if (others.length === 1) {
    return {
      systemInstruction: systemInstruction || undefined,
      userText: (others[0].content ?? "").trim(),
    }
  }

  const userText = others
    .map((m) => {
      const r = String(m.role || "user").toLowerCase()
      const c = (m.content ?? "").trim()
      if (!c) return ""
      if (r === "user") return `User:\n${c}`
      if (r === "assistant" || r === "model") return `Assistant:\n${c}`
      return `${m.role}:\n${c}`
    })
    .filter(Boolean)
    .join("\n\n")

  return { systemInstruction: systemInstruction || undefined, userText }
}

function sanitizeModelOutput(raw: string): string {
  let t = raw.trim()
  while (true) {
    const m = /^(student|doctor|patient|user|assistant|model)\s*:\s*/im.exec(t)
    if (!m || m.index !== 0) break
    t = t.slice(m[0].length).trim()
  }
  return t
}

function extractTextFromResponse(result: {
  response: {
    text: () => string
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
}): string {
  try {
    const via = result.response.text()
    if (via?.trim()) return via
  } catch {
    /* fall through to parts */
  }
  const parts = result.response.candidates?.[0]?.content?.parts
  if (!parts?.length) return ""
  return parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("").trim()
}

function clampMaxOutputTokens(requested: unknown): number {
  const n = typeof requested === "number" ? requested : Number(requested)
  const base = Number.isFinite(n) && n > 0 ? n : 512
  // Evaluation + SOAP JSON need headroom; clients used 96/150 and hit MAX_TOKENS constantly.
  return Math.min(8192, Math.max(256, base))
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
    const { model, messages, maxTokens = 512, temperature = 0.7 } = body || {}

    if (!model || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "model and messages are required" })
    }

    const { systemInstruction, userText } = extractSystemAndUser(messages as Message[])
    if (!userText.trim()) {
      return res.status(400).json({ error: "No user content after splitting system messages" })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    let maxOut = clampMaxOutputTokens(maxTokens)
    let lastFinish = ""
    let lastRaw = ""

    for (let attempt = 0; attempt < 2; attempt++) {
      const generationConfig: Record<string, unknown> = {
        temperature,
        maxOutputTokens: maxOut,
      }
      // Align with Practice/Learning: avoid implicit “thinking” eating the tiny maxOutput budgets
      // callers used for short interview lines (fixes mid-sentence cutoffs on 2.5 Flash).
      if (/gemini-2\.5/i.test(String(model))) {
        generationConfig.thinkingConfig = { thinkingBudget: 0 }
      }

      const gm = genAI.getGenerativeModel({
        model: String(model),
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig,
      })

      const result = await gm.generateContent(userText)
      const cand = result.response.candidates?.[0]
      lastFinish = String(cand?.finishReason ?? "")
      lastRaw = extractTextFromResponse(result)
      const cleaned = sanitizeModelOutput(lastRaw)

      if (!cleaned) {
        if (lastFinish === "MAX_TOKENS" && attempt === 0) {
          maxOut = Math.min(8192, maxOut * 2)
          continue
        }
        return res.status(500).json({ error: "Gemini API returned an empty response." })
      }

      if (lastFinish !== "MAX_TOKENS") {
        return res.status(200).json({ text: cleaned })
      }

      maxOut = Math.min(8192, maxOut * 2)
    }

    const cleaned = sanitizeModelOutput(lastRaw)
    if (!cleaned) {
      return res.status(500).json({ error: "Gemini API returned an empty response.", finishReason: lastFinish })
    }
    return res.status(200).json({ text: cleaned, truncated: lastFinish === "MAX_TOKENS" })
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ error: "Failed to generate evaluation response", details })
  }
}
