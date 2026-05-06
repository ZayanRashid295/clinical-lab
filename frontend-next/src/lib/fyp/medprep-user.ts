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

export function toMedPrepUser(
  clinicalUser: { id: string; email: string; name: string; roles?: string[] } | null
): User | null {
  if (!clinicalUser?.id) return null
  const isAdmin = clinicalUser.roles?.some((r) => /admin/i.test(String(r)))
  const role: User["role"] = isAdmin ? "ADMIN" : "STUDENT"
  const now = new Date()
  return {
    id: String(clinicalUser.id),
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
