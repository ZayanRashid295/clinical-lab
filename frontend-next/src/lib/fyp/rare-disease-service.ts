import { MedicalCase, rareDiseases } from "./data-models"

export interface RareDiseaseClue {
  type: "symptom" | "history" | "lab" | "physical" | "family"
  content: string
  subtlety: "obvious" | "moderate" | "subtle"
  importance: "critical" | "important" | "supporting"
}

export interface RareDiseasePresentation {
  diseaseName: string
  commonMimics: string[] // Common diseases that could be confused
  subtleClues: RareDiseaseClue[]
  redFlags: string[] // Warning signs that suggest rare disease
  diagnosticPathway: string[] // Steps to reach diagnosis
}

class RareDiseaseService {
  private rareDiseasePresentations: Record<string, RareDiseasePresentation> = {
    "Marfan Syndrome": {
      diseaseName: "Marfan Syndrome",
      commonMimics: ["Hypertension", "Aortic Stenosis", "Mitral Valve Prolapse", "Ehlers-Danlos Syndrome"],
      subtleClues: [
        { type: "physical", content: "Tall stature with long limbs", subtlety: "obvious", importance: "critical" },
        { type: "physical", content: "Arm span greater than height", subtlety: "moderate", importance: "important" },
        { type: "physical", content: "Flexible joints", subtlety: "moderate", importance: "supporting" },
        { type: "family", content: "Family history of sudden cardiac death", subtlety: "subtle", importance: "critical" },
        { type: "symptom", content: "Vision problems or lens dislocation", subtlety: "moderate", importance: "important" },
        { type: "lab", content: "Aortic root dilatation on echocardiogram", subtlety: "obvious", importance: "critical" }
      ],
      redFlags: ["Tall stature", "Family history of aortic dissection", "Lens dislocation", "Pectus excavatum"],
      diagnosticPathway: ["Physical examination", "Echocardiogram", "Slit-lamp examination", "Genetic testing"]
    },
    "Addison's Disease": {
      diseaseName: "Addison's Disease",
      commonMimics: ["Depression", "Anemia", "Hypothyroidism", "Chronic Fatigue Syndrome"],
      subtleClues: [
        { type: "symptom", content: "Darkening of skin (hyperpigmentation)", subtlety: "obvious", importance: "critical" },
        { type: "symptom", content: "Salt craving", subtlety: "subtle", importance: "important" },
        { type: "symptom", content: "Low blood pressure", subtlety: "moderate", importance: "important" },
        { type: "symptom", content: "Weight loss despite normal appetite", subtlety: "moderate", importance: "supporting" },
        { type: "lab", content: "Low cortisol levels", subtlety: "obvious", importance: "critical" },
        { type: "lab", content: "Elevated ACTH", subtlety: "obvious", importance: "critical" }
      ],
      redFlags: ["Hyperpigmentation", "Salt craving", "Postural hypotension", "Previous autoimmune disease"],
      diagnosticPathway: ["Morning cortisol", "ACTH stimulation test", "ACTH level", "Adrenal antibodies"]
    },
    "Cushing's Syndrome": {
      diseaseName: "Cushing's Syndrome",
      commonMimics: ["Obesity", "Diabetes", "Depression", "Metabolic Syndrome"],
      subtleClues: [
        { type: "physical", content: "Moon face", subtlety: "obvious", importance: "critical" },
        { type: "physical", content: "Buffalo hump", subtlety: "obvious", importance: "critical" },
        { type: "symptom", content: "Purple striae", subtlety: "moderate", importance: "important" },
        { type: "symptom", content: "Muscle weakness", subtlety: "moderate", importance: "supporting" },
        { type: "history", content: "Recent steroid use", subtlety: "obvious", importance: "critical" },
        { type: "lab", content: "Elevated cortisol", subtlety: "obvious", importance: "critical" }
      ],
      redFlags: ["Moon face", "Buffalo hump", "Steroid use", "Purple striae"],
      diagnosticPathway: ["24-hour urine cortisol", "Dexamethasone suppression test", "ACTH level", "Imaging"]
    },
    "Ehlers-Danlos Syndrome": {
      diseaseName: "Ehlers-Danlos Syndrome",
      commonMimics: ["Fibromyalgia", "Chronic Pain Syndrome", "Joint Hypermobility Syndrome"],
      subtleClues: [
        { type: "physical", content: "Joint hypermobility", subtlety: "obvious", importance: "critical" },
        { type: "physical", content: "Skin hyperextensibility", subtlety: "moderate", importance: "important" },
        { type: "symptom", content: "Easy bruising", subtlety: "moderate", importance: "supporting" },
        { type: "symptom", content: "Chronic joint dislocations", subtlety: "obvious", importance: "critical" },
        { type: "family", content: "Family history of similar symptoms", subtlety: "subtle", importance: "important" },
        { type: "lab", content: "Genetic testing for collagen mutations", subtlety: "obvious", importance: "critical" }
      ],
      redFlags: ["Joint hypermobility", "Easy bruising", "Chronic dislocations", "Family history"],
      diagnosticPathway: ["Beighton score", "Skin biopsy", "Genetic testing", "Family history"]
    },
    "Huntington's Disease": {
      diseaseName: "Huntington's Disease",
      commonMimics: ["Parkinson's Disease", "Dementia", "Depression", "Tourette Syndrome"],
      subtleClues: [
        { type: "symptom", content: "Involuntary movements (chorea)", subtlety: "obvious", importance: "critical" },
        { type: "symptom", content: "Cognitive decline", subtlety: "moderate", importance: "important" },
        { type: "symptom", content: "Mood changes or depression", subtlety: "subtle", importance: "supporting" },
        { type: "family", content: "Family history of Huntington's", subtlety: "obvious", importance: "critical" },
        { type: "symptom", content: "Difficulty swallowing", subtlety: "moderate", importance: "supporting" },
        { type: "lab", content: "CAG repeat expansion on genetic testing", subtlety: "obvious", importance: "critical" }
      ],
      redFlags: ["Chorea", "Family history", "Cognitive decline", "Psychiatric symptoms"],
      diagnosticPathway: ["Family history", "Neurological examination", "Genetic counseling", "CAG repeat testing"]
    },
    "Wilson's Disease": {
      diseaseName: "Wilson's Disease",
      commonMimics: ["Hepatitis", "Cirrhosis", "Parkinson's Disease", "Psychiatric disorders"],
      subtleClues: [
        { type: "physical", content: "Kayser-Fleischer rings", subtlety: "obvious", importance: "critical" },
        { type: "symptom", content: "Liver problems", subtlety: "moderate", importance: "important" },
        { type: "symptom", content: "Neurological symptoms", subtlety: "moderate", importance: "important" },
        { type: "symptom", content: "Psychiatric symptoms", subtlety: "subtle", importance: "supporting" },
        { type: "lab", content: "Low serum copper", subtlety: "obvious", importance: "critical" },
        { type: "lab", content: "Elevated urine copper", subtlety: "obvious", importance: "critical" }
      ],
      redFlags: ["Kayser-Fleischer rings", "Young age with liver disease", "Neurological + psychiatric symptoms"],
      diagnosticPathway: ["Slit-lamp examination", "Serum copper", "Urine copper", "Genetic testing"]
    }
  }

  /**
   * Enhance a rare disease case with subtle clues and realistic presentation
   */
  enhanceRareDiseaseCase(medicalCase: MedicalCase): MedicalCase {
    if (!medicalCase.isRare) {
      return medicalCase
    }

    const presentation = this.rareDiseasePresentations[medicalCase.diseaseName]
    if (!presentation) {
      return medicalCase
    }

    // Add subtle clues to symptoms
    const enhancedSymptoms = [...medicalCase.symptoms]
    presentation.subtleClues.forEach(clue => {
      if (clue.type === "symptom" && clue.subtlety === "subtle") {
        if (!enhancedSymptoms.includes(clue.content)) {
          enhancedSymptoms.push(clue.content)
        }
      }
    })

    // Add family history clues
    const enhancedHistory = [...medicalCase.history]
    presentation.subtleClues.forEach(clue => {
      if (clue.type === "family" && clue.subtlety === "subtle") {
        if (!enhancedHistory.includes(clue.content)) {
          enhancedHistory.push(clue.content)
        }
      }
    })

    // Add subtle lab findings
    const enhancedLabs = { ...medicalCase.labs }
    presentation.subtleClues.forEach(clue => {
      if (clue.type === "lab" && clue.subtlety === "subtle") {
        // Add subtle lab findings that might be missed
        if (!enhancedLabs[clue.content]) {
          enhancedLabs[clue.content] = "subtle abnormality"
        }
      }
    })

    return {
      ...medicalCase,
      symptoms: enhancedSymptoms,
      history: enhancedHistory,
      labs: enhancedLabs
    }
  }

  /**
   * Generate hints for rare disease cases based on conversation progress
   */
  generateRareDiseaseHints(
    medicalCase: MedicalCase,
    conversationHistory: Array<{ role: string; content: string }>,
    questionCount: number
  ): string[] {
    if (!medicalCase.isRare) {
      return []
    }

    const presentation = this.rareDiseasePresentations[medicalCase.diseaseName]
    if (!presentation) {
      return []
    }

    const hints: string[] = []

    // Progressive hints based on conversation depth
    if (questionCount >= 5) {
      hints.push("Consider rare diseases in your differential diagnosis")
    }

    if (questionCount >= 8) {
      hints.push("Look for subtle physical examination findings")
    }

    if (questionCount >= 12) {
      hints.push("Consider family history and genetic factors")
    }

    if (questionCount >= 15) {
      hints.push("Review specialized laboratory tests and imaging")
    }

    // Context-specific hints based on conversation
    const conversationText = conversationHistory.map(msg => msg.content).join(" ").toLowerCase()
    
    if (conversationText.includes("family") && !conversationText.includes("history")) {
      hints.push("Ask about family medical history")
    }

    if (conversationText.includes("vision") || conversationText.includes("eye")) {
      hints.push("Consider ophthalmological examination")
    }

    if (conversationText.includes("joint") || conversationText.includes("flexible")) {
      hints.push("Assess joint mobility and skin elasticity")
    }

    if (conversationText.includes("skin") || conversationText.includes("color")) {
      hints.push("Examine skin pigmentation and texture")
    }

    return hints
  }

  /**
   * Check if a case should be flagged as potentially rare based on symptoms
   */
  checkForRareDiseaseRedFlags(symptoms: string[], history: string[]): {
    isRare: boolean
    redFlags: string[]
    suggestedDiseases: string[]
  } {
    const allText = [...symptoms, ...history].join(" ").toLowerCase()
    const redFlags: string[] = []
    const suggestedDiseases: string[] = []

    // Check for red flags across all rare diseases
    Object.values(this.rareDiseasePresentations).forEach(presentation => {
      presentation.redFlags.forEach(flag => {
        if (allText.includes(flag.toLowerCase())) {
          redFlags.push(flag)
          if (!suggestedDiseases.includes(presentation.diseaseName)) {
            suggestedDiseases.push(presentation.diseaseName)
          }
        }
      })
    })

    return {
      isRare: redFlags.length > 0,
      redFlags,
      suggestedDiseases
    }
  }

  /**
   * Get diagnostic pathway for a rare disease
   */
  getDiagnosticPathway(diseaseName: string): string[] {
    const presentation = this.rareDiseasePresentations[diseaseName]
    return presentation ? presentation.diagnosticPathway : []
  }

  /**
   * Get common mimics for a rare disease
   */
  getCommonMimics(diseaseName: string): string[] {
    const presentation = this.rareDiseasePresentations[diseaseName]
    return presentation ? presentation.commonMimics : []
  }

  /**
   * Generate educational feedback for rare disease cases
   */
  generateRareDiseaseFeedback(
    medicalCase: MedicalCase,
    submittedDiagnosis: string,
    isCorrect: boolean
  ): {
    educationalPoints: string[]
    keyLearningObjectives: string[]
    clinicalPearls: string[]
    nextSteps: string[]
  } {
    if (!medicalCase.isRare) {
      return {
        educationalPoints: [],
        keyLearningObjectives: [],
        clinicalPearls: [],
        nextSteps: []
      }
    }

    const presentation = this.rareDiseasePresentations[medicalCase.diseaseName]
    if (!presentation) {
      return {
        educationalPoints: [],
        keyLearningObjectives: [],
        clinicalPearls: [],
        nextSteps: []
      }
    }

    const educationalPoints: string[] = []
    const keyLearningObjectives: string[] = []
    const clinicalPearls: string[] = []
    const nextSteps: string[] = []

    if (isCorrect) {
      educationalPoints.push(`Excellent! You correctly identified ${medicalCase.diseaseName}`)
      educationalPoints.push("Rare diseases require careful consideration of subtle clues")
      educationalPoints.push("Family history and physical examination are crucial")
    } else {
      educationalPoints.push(`The correct diagnosis was ${medicalCase.diseaseName}`)
      educationalPoints.push("This is a rare disease that can mimic common conditions")
      educationalPoints.push("Consider rare diseases when common diagnoses don't fit")
    }

    keyLearningObjectives.push("Recognize red flags for rare diseases")
    keyLearningObjectives.push("Understand the importance of family history")
    keyLearningObjectives.push("Learn to perform targeted physical examinations")
    keyLearningObjectives.push("Know when to consider genetic testing")

    clinicalPearls.push(...presentation.redFlags.map(flag => `Red flag: ${flag}`))
    clinicalPearls.push(`Common mimics: ${presentation.commonMimics.join(", ")}`)

    nextSteps.push(...presentation.diagnosticPathway)
    nextSteps.push("Consider genetic counseling if appropriate")
    nextSteps.push("Refer to appropriate specialists")

    return {
      educationalPoints,
      keyLearningObjectives,
      clinicalPearls,
      nextSteps
    }
  }
}

export const rareDiseaseService = new RareDiseaseService()

