import fs from "fs"
import path from "path"

/** Mirrors other MedPrep `/pages/api/learning/*` routes: allow key from repo `backend/.env`. */
export function hydrateGeminiApiKeyFromBackendEnv(): void {
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
  const geminiKeyMatch = backendEnv.match(
    /^(?:GOOGLE_API_KEY|GEMINI_API_KEY)\s*=\s*("?)(.*?)\1\s*$/m,
  )
  if (!geminiKeyMatch?.[2]) return
  process.env.GOOGLE_API_KEY = geminiKeyMatch[2]
}
