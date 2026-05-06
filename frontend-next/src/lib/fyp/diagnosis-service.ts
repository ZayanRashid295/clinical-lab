import { DiagnosisSubmission, MedicalCase } from "./data-models"

class DiagnosisService {
  private submissions: DiagnosisSubmission[] = []

  /**
   * Submit a diagnosis guess and compare with the actual diagnosis
   */
  submitDiagnosis(
    conversationId: string,
    studentId: string,
    submittedDiagnosis: string,
    medicalCase: MedicalCase
  ): DiagnosisSubmission {
    const actualDiagnosis = medicalCase.diseaseName // Hidden from student & AI doctor
    const isCorrect = this.compareDiagnoses(submittedDiagnosis, actualDiagnosis)

    const submission: DiagnosisSubmission = {
      id: this.generateId(),
      conversationId,
      studentId,
      submittedDiagnosis,
      actualDiagnosis,
      isCorrect,
      submittedAt: new Date().toISOString(),
      caseMetadata: {
        isRare: medicalCase.isRare,
        specialty: medicalCase.specialty,
        difficulty: medicalCase.difficulty
      }
    }

    this.submissions.push(submission)
    return submission
  }

  /**
   * Compare submitted diagnosis with actual diagnosis
   * Uses fuzzy matching to account for variations in terminology
   */
  private compareDiagnoses(submitted: string, actual: string): boolean {
    const normalize = (str: string) => 
      str.toLowerCase()
         .replace(/[^\w\s]/g, '') // Remove punctuation
         .replace(/\s+/g, ' ')     // Normalize whitespace
         .trim()

    const normalizedSubmitted = normalize(submitted)
    const normalizedActual = normalize(actual)

    // Exact match
    if (normalizedSubmitted === normalizedActual) {
      return true
    }

    // Check for common variations and synonyms
    const synonyms: Record<string, string[]> = {
      "myocardial infarction": ["heart attack", "mi", "acute mi", "stemi", "nstemi"],
      "appendicitis": ["acute appendicitis", "appendix inflammation"],
      "pneumonia": ["community acquired pneumonia", "cap", "lung infection"],
      "diabetes mellitus type 2": ["type 2 diabetes", "t2dm", "diabetes type 2", "adult onset diabetes"],
      "hypertension": ["high blood pressure", "htn", "elevated blood pressure"],
      "asthma": ["bronchial asthma", "reactive airway disease"],
      "copd": ["chronic obstructive pulmonary disease", "chronic bronchitis", "emphysema"],
      "gastroesophageal reflux disease": ["gerd", "acid reflux", "heartburn"],
      "peptic ulcer disease": ["gastric ulcer", "duodenal ulcer", "stomach ulcer"],
      "cholecystitis": ["gallbladder inflammation", "acute cholecystitis"],
      "diverticulitis": ["diverticular disease", "colonic diverticulitis"],
      "urinary tract infection": ["uti", "bladder infection", "cystitis"],
      "migraine": ["migraine headache", "vascular headache"],
      "depression": ["major depressive disorder", "mdd", "clinical depression"],
      "anxiety disorder": ["generalized anxiety disorder", "gad", "anxiety"],
      "osteoarthritis": ["degenerative joint disease", "djd", "oa"],
      "rheumatoid arthritis": ["ra", "inflammatory arthritis"],
      "hypothyroidism": ["underactive thyroid", "thyroid deficiency"],
      "hyperthyroidism": ["overactive thyroid", "thyrotoxicosis"],
      "anemia": ["iron deficiency anemia", "low hemoglobin"],
      "atrial fibrillation": ["afib", "af", "irregular heartbeat"],
      "heart failure": ["congestive heart failure", "chf", "cardiac failure"],
      "stroke": ["cerebrovascular accident", "cva", "brain attack"],
      "chronic kidney disease": ["ckd", "renal failure", "kidney disease"],
      "liver cirrhosis": ["hepatic cirrhosis", "end stage liver disease"],
      "marfan syndrome": ["marfan's syndrome", "marfan disease"],
      "addison's disease": ["adrenal insufficiency", "primary adrenal insufficiency"],
      "cushing's syndrome": ["hypercortisolism", "cushing disease"],
      "ehlers-danlos syndrome": ["eds", "ehlers danlos", "connective tissue disorder"],
      "huntington's disease": ["huntington chorea", "hd", "huntington's chorea"],
      "wilson's disease": ["hepatolenticular degeneration", "copper storage disease"],
      "systemic lupus erythematosus": ["lupus", "sle", "lupus erythematosus"],
      "sjögren's syndrome": ["sjogren syndrome", "sicca syndrome"],
      "scleroderma": ["systemic sclerosis", "progressive systemic sclerosis"]
    }

    // Check if submitted diagnosis matches any synonym of actual diagnosis
    const actualSynonyms = synonyms[normalizedActual] || []
    if (actualSynonyms.includes(normalizedSubmitted)) {
      return true
    }

    // Check if actual diagnosis matches any synonym of submitted diagnosis
    const submittedSynonyms = synonyms[normalizedSubmitted] || []
    if (submittedSynonyms.includes(normalizedActual)) {
      return true
    }

    // Check for partial matches (for complex diagnoses)
    const wordsSubmitted = normalizedSubmitted.split(' ')
    const wordsActual = normalizedActual.split(' ')
    
    // If more than 70% of words match, consider it correct
    const matchingWords = wordsSubmitted.filter(word => 
      wordsActual.some(actualWord => actualWord.includes(word) || word.includes(actualWord))
    )
    
    if (wordsSubmitted.length > 0 && matchingWords.length / wordsSubmitted.length >= 0.7) {
      return true
    }

    return false
  }

  /**
   * Get diagnosis submission by ID
   */
  getSubmission(submissionId: string): DiagnosisSubmission | undefined {
    return this.submissions.find(s => s.id === submissionId)
  }

  /**
   * Get all submissions for a student
   */
  getStudentSubmissions(studentId: string): DiagnosisSubmission[] {
    return this.submissions.filter(s => s.studentId === studentId)
  }

  /**
   * Get all submissions for a conversation
   */
  getConversationSubmissions(conversationId: string): DiagnosisSubmission[] {
    return this.submissions.filter(s => s.conversationId === conversationId)
  }

  /**
   * Get the latest diagnosis submission for a conversation
   */
  getLatestConversationSubmission(conversationId: string): DiagnosisSubmission | undefined {
    const subs = this.getConversationSubmissions(conversationId)
    if (subs.length === 0) return undefined
    return subs
      .slice()
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0]
  }

  /**
   * Get diagnosis accuracy statistics for a student
   */
  getStudentDiagnosisStats(studentId: string): {
    totalSubmissions: number
    correctDiagnoses: number
    accuracy: number
    rareDiseaseAccuracy: number
    commonDiseaseAccuracy: number
    specialtyBreakdown: Record<string, { total: number; correct: number; accuracy: number }>
  } {
    const submissions = this.getStudentSubmissions(studentId)
    
    const totalSubmissions = submissions.length
    const correctDiagnoses = submissions.filter(s => s.isCorrect).length
    const accuracy = totalSubmissions > 0 ? (correctDiagnoses / totalSubmissions) * 100 : 0

    const rareDiseaseSubmissions = submissions.filter(s => s.caseMetadata.isRare)
    const rareDiseaseCorrect = rareDiseaseSubmissions.filter(s => s.isCorrect).length
    const rareDiseaseAccuracy = rareDiseaseSubmissions.length > 0 
      ? (rareDiseaseCorrect / rareDiseaseSubmissions.length) * 100 
      : 0

    const commonDiseaseSubmissions = submissions.filter(s => !s.caseMetadata.isRare)
    const commonDiseaseCorrect = commonDiseaseSubmissions.filter(s => s.isCorrect).length
    const commonDiseaseAccuracy = commonDiseaseSubmissions.length > 0 
      ? (commonDiseaseCorrect / commonDiseaseSubmissions.length) * 100 
      : 0

    // Specialty breakdown
    const specialtyBreakdown: Record<string, { total: number; correct: number; accuracy: number }> = {}
    submissions.forEach(submission => {
      const specialty = submission.caseMetadata.specialty
      if (!specialtyBreakdown[specialty]) {
        specialtyBreakdown[specialty] = { total: 0, correct: 0, accuracy: 0 }
      }
      specialtyBreakdown[specialty].total++
      if (submission.isCorrect) {
        specialtyBreakdown[specialty].correct++
      }
    })

    // Calculate accuracy for each specialty
    Object.keys(specialtyBreakdown).forEach(specialty => {
      const stats = specialtyBreakdown[specialty]
      stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    })

    return {
      totalSubmissions,
      correctDiagnoses,
      accuracy,
      rareDiseaseAccuracy,
      commonDiseaseAccuracy,
      specialtyBreakdown
    }
  }

  /**
   * Get global diagnosis statistics
   */
  getGlobalDiagnosisStats(): {
    totalSubmissions: number
    overallAccuracy: number
    rareDiseaseAccuracy: number
    commonDiseaseAccuracy: number
    topSpecialties: Array<{ specialty: string; accuracy: number; submissions: number }>
  } {
    const totalSubmissions = this.submissions.length
    const correctDiagnoses = this.submissions.filter(s => s.isCorrect).length
    const overallAccuracy = totalSubmissions > 0 ? (correctDiagnoses / totalSubmissions) * 100 : 0

    const rareDiseaseSubmissions = this.submissions.filter(s => s.caseMetadata.isRare)
    const rareDiseaseCorrect = rareDiseaseSubmissions.filter(s => s.isCorrect).length
    const rareDiseaseAccuracy = rareDiseaseSubmissions.length > 0 
      ? (rareDiseaseCorrect / rareDiseaseSubmissions.length) * 100 
      : 0

    const commonDiseaseSubmissions = this.submissions.filter(s => !s.caseMetadata.isRare)
    const commonDiseaseCorrect = commonDiseaseSubmissions.filter(s => s.isCorrect).length
    const commonDiseaseAccuracy = commonDiseaseSubmissions.length > 0 
      ? (commonDiseaseCorrect / commonDiseaseSubmissions.length) * 100 
      : 0

    // Top specialties by accuracy
    const specialtyStats: Record<string, { correct: number; total: number }> = {}
    this.submissions.forEach(submission => {
      const specialty = submission.caseMetadata.specialty
      if (!specialtyStats[specialty]) {
        specialtyStats[specialty] = { correct: 0, total: 0 }
      }
      specialtyStats[specialty].total++
      if (submission.isCorrect) {
        specialtyStats[specialty].correct++
      }
    })

    const topSpecialties = Object.entries(specialtyStats)
      .map(([specialty, stats]) => ({
        specialty,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        submissions: stats.total
      }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 10)

    return {
      totalSubmissions,
      overallAccuracy,
      rareDiseaseAccuracy,
      commonDiseaseAccuracy,
      topSpecialties
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}

export const diagnosisService = new DiagnosisService()

