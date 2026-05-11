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
