/**
 * FYP MedPrep CaseChat expects this User shape. Map from clinical auth when needed.
 */
export interface User {
  id: string
  email: string
  name: string
  role: "STUDENT" | "ADMIN" | "INSTRUCTOR"
  createdAt: Date
  totalPoints: number
  level: number
  streak: number
  lastLogin: Date | null
}

/** Resolve backend/stored user id regardless of whether the profile uses `id`, `userId`, or JWT `sub`. */
export function getClinicalUserId(clinicalUser: unknown): string | null {
  if (!clinicalUser || typeof clinicalUser !== "object") return null
  const u = clinicalUser as Record<string, unknown>
  const raw = u.id ?? u.userId ?? u.sub
  if (raw == null || raw === "") return null
  return String(raw)
}

/**
 * MedPrep session POST must not run before auth hydrates (same issue as PracticeCaseRoutePage).
 * Polls the getter until a non-anonymous id exists or maxMs elapses.
 */
export async function waitForClinicalUserId(
  getUser: () => unknown,
  opts?: { maxMs?: number; stepMs?: number },
): Promise<string | null> {
  const maxMs = opts?.maxMs ?? 10_000
  const stepMs = opts?.stepMs ?? 50
  for (let t = 0; t < maxMs; t += stepMs) {
    const uid = getClinicalUserId(getUser())
    if (uid && uid !== "anonymous") return uid
    await new Promise((r) => setTimeout(r, stepMs))
  }
  return getClinicalUserId(getUser())
}

export function toMedPrepUser(
  clinicalUser: { id?: string; userId?: string; email?: string; name?: string; roles?: string[] } | null
): User | null {
  const cid = getClinicalUserId(clinicalUser)
  if (!cid || !clinicalUser) return null
  const isAdmin = clinicalUser.roles?.some((r) => /admin/i.test(String(r)))
  const role: User["role"] = isAdmin ? "ADMIN" : "STUDENT"
  const now = new Date()
  return {
    id: cid,
    email: clinicalUser.email || "user@local",
    name: clinicalUser.name || "Student",
    role,
    createdAt: now,
    totalPoints: 0,
    level: 1,
    streak: 0,
    lastLogin: now,
  }
}
