import type { MedicalCase } from "@/lib/fyp/data-models"

/**
 * Client for shadow-mode case listing (Next `/api/learning/cases`).
 * Mirrors the edu `learningService` surface used by shadow UI.
 */
class ShadowLearningClient {
  async getAllCases(): Promise<MedicalCase[]> {
    const res = await fetch("/api/learning/cases", { cache: "no-store" })
    if (!res.ok) {
      const t = await res.text().catch(() => "")
      throw new Error(`Failed to load cases: ${res.status} ${t}`)
    }
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }

  async getCaseById(caseId: string): Promise<MedicalCase | null> {
    const all = await this.getAllCases()
    return all.find((c) => c.id === caseId) ?? null
  }
}

export const learningService = new ShadowLearningClient()
