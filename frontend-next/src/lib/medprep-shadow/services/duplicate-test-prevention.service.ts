export interface TestRequest {
  testType: string
  specificTestName?: string
  patientId: string
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingReport?: unknown
  systemNote?: string
  shouldProceed: boolean
}

class DuplicateTestPreventionService {
  private static instance: DuplicateTestPreventionService

  static getInstance(): DuplicateTestPreventionService {
    if (!DuplicateTestPreventionService.instance) {
      DuplicateTestPreventionService.instance = new DuplicateTestPreventionService()
    }
    return DuplicateTestPreventionService.instance
  }

  async checkForDuplicate(_request: TestRequest): Promise<DuplicateCheckResult> {
    return { isDuplicate: false, shouldProceed: true }
  }

  generateDuplicateTestNote(testType: string, existingReport: { timestamp?: string }): string {
    const when = existingReport.timestamp
      ? new Date(existingReport.timestamp).toLocaleDateString()
      : "prior visit"
    return `[SYSTEM NOTE: ${testType} report already available from ${when}.]`
  }
}

export const duplicateTestPreventionService = DuplicateTestPreventionService.getInstance()
