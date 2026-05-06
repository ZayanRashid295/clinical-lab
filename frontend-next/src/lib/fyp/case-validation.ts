import type { MedicalCase } from './data-models'

/**
 * Validates and fixes case data consistency issues
 */
export class CaseValidationService {
  
  /**
   * Validates if a case has consistent data between title, specialty, and symptoms
   */
  static validateCaseConsistency(caseData: MedicalCase): {
    isValid: boolean
    issues: string[]
    fixedCase?: MedicalCase
  } {
    const issues: string[] = []
    
    // Check if required fields exist
    if (!caseData.title) issues.push('Missing case title')
    if (!caseData.specialty) issues.push('Missing specialty')
    if (!caseData.symptoms || caseData.symptoms.length === 0) issues.push('Missing symptoms')
    if (!caseData.disease) issues.push('Missing disease information')
    
    // Check for consistency between title and specialty
    if (caseData.title && caseData.specialty) {
      const titleLower = caseData.title.toLowerCase()
      const specialtyLower = caseData.specialty.toLowerCase()
      
      // Common inconsistencies
      if (titleLower.includes('abdominal') && !specialtyLower.includes('surgery') && !specialtyLower.includes('gastro')) {
        issues.push('Title suggests abdominal condition but specialty is not GI/Surgery')
      }
      if (titleLower.includes('chest') && !specialtyLower.includes('cardio')) {
        issues.push('Title suggests chest condition but specialty is not Cardiology')
      }
      if (titleLower.includes('headache') && !specialtyLower.includes('neuro')) {
        issues.push('Title suggests neurological condition but specialty is not Neurology')
      }
      if (titleLower.includes('respiratory') && !specialtyLower.includes('pulmo')) {
        issues.push('Title suggests respiratory condition but specialty is not Pulmonology')
      }
    }
    
    // Check for consistency between specialty and symptoms
    if (caseData.specialty && caseData.symptoms) {
      const specialtyLower = caseData.specialty.toLowerCase()
      const symptomsText = caseData.symptoms.join(' ').toLowerCase()
      
      if (specialtyLower.includes('neuro')) {
        const neuroSymptoms = ['headache', 'seizure', 'weakness', 'numbness', 'vision', 'dizziness', 'confusion']
        const hasNeuroSymptoms = neuroSymptoms.some(symptom => symptomsText.includes(symptom))
        if (!hasNeuroSymptoms) {
          issues.push('Neurology specialty but no neurological symptoms found')
        }
      }
      
      if (specialtyLower.includes('cardio')) {
        const cardioSymptoms = ['chest pain', 'shortness of breath', 'palpitations', 'syncope', 'edema']
        const hasCardioSymptoms = cardioSymptoms.some(symptom => symptomsText.includes(symptom))
        if (!hasCardioSymptoms) {
          issues.push('Cardiology specialty but no cardiovascular symptoms found')
        }
      }
      
      if (specialtyLower.includes('gastro') || specialtyLower.includes('surgery')) {
        const gastroSymptoms = ['abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'constipation']
        const hasGastroSymptoms = gastroSymptoms.some(symptom => symptomsText.includes(symptom))
        if (!hasGastroSymptoms) {
          issues.push('GI/Surgery specialty but no gastrointestinal symptoms found')
        }
      }
    }
    
    const isValid = issues.length === 0
    
    // If there are issues, try to fix them
    let fixedCase: MedicalCase | undefined
    if (!isValid) {
      fixedCase = this.attemptFix(caseData, issues)
    }
    
    return {
      isValid,
      issues,
      fixedCase
    }
  }
  
  /**
   * Attempts to fix common case data inconsistencies
   */
  private static attemptFix(caseData: MedicalCase, issues: string[]): MedicalCase {
    const fixedCase = { ...caseData }
    
    // Fix specialty based on symptoms if it's clearly wrong
    if (caseData.symptoms && caseData.symptoms.length > 0) {
      const symptomsText = caseData.symptoms.join(' ').toLowerCase()
      
      // If symptoms are clearly neurological but specialty is wrong
      if (symptomsText.includes('headache') && !caseData.specialty.toLowerCase().includes('neuro')) {
        fixedCase.specialty = 'Neurology'
        console.warn('Fixed case: Changed specialty to Neurology based on headache symptoms')
      }
      
      // If symptoms are clearly cardiac but specialty is wrong
      if (symptomsText.includes('chest pain') && !caseData.specialty.toLowerCase().includes('cardio')) {
        fixedCase.specialty = 'Cardiology'
        console.warn('Fixed case: Changed specialty to Cardiology based on chest pain symptoms')
      }
      
      // If symptoms are clearly GI but specialty is wrong
      if ((symptomsText.includes('abdominal pain') || symptomsText.includes('nausea')) && 
          !caseData.specialty.toLowerCase().includes('gastro') && 
          !caseData.specialty.toLowerCase().includes('surgery')) {
        fixedCase.specialty = 'Gastroenterology'
        console.warn('Fixed case: Changed specialty to Gastroenterology based on GI symptoms')
      }
    }
    
    // Fix title based on specialty and symptoms
    if (fixedCase.specialty && fixedCase.symptoms) {
      const specialtyLower = fixedCase.specialty.toLowerCase()
      const symptomsText = fixedCase.symptoms.join(' ').toLowerCase()
      
      if (specialtyLower.includes('neuro') && !fixedCase.title.toLowerCase().includes('headache') && !fixedCase.title.toLowerCase().includes('neuro')) {
        fixedCase.title = symptomsText.includes('headache') ? 'Headache Case' : 'Neurological Case'
        console.warn('Fixed case: Updated title to match neurological specialty')
      }
      
      if (specialtyLower.includes('cardio') && !fixedCase.title.toLowerCase().includes('chest') && !fixedCase.title.toLowerCase().includes('cardio')) {
        fixedCase.title = symptomsText.includes('chest pain') ? 'Chest Pain Case' : 'Cardiovascular Case'
        console.warn('Fixed case: Updated title to match cardiac specialty')
      }
      
      if ((specialtyLower.includes('gastro') || specialtyLower.includes('surgery')) && 
          !fixedCase.title.toLowerCase().includes('abdominal') && 
          !fixedCase.title.toLowerCase().includes('gi')) {
        fixedCase.title = symptomsText.includes('abdominal pain') ? 'Abdominal Pain Case' : 'Gastroenterology Case'
        console.warn('Fixed case: Updated title to match GI specialty')
      }
    }
    
    return fixedCase
  }
  
  /**
   * Validates and fixes case data, logging any issues found
   */
  static validateAndFixCase(caseData: MedicalCase): MedicalCase {
    const validation = this.validateCaseConsistency(caseData)
    
    if (!validation.isValid) {
      console.warn('Case data consistency issues found:', validation.issues)
      console.warn('Original case data:', caseData)
      
      if (validation.fixedCase) {
        console.warn('Fixed case data:', validation.fixedCase)
        return validation.fixedCase
      }
    }
    
    return caseData
  }
}

export const caseValidationService = new CaseValidationService()
