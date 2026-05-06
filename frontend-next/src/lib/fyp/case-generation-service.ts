import { MedicalCase, rareDiseases, commonDiseases } from "./data-models"
import { rareDiseaseService } from "./rare-disease-service"

export interface CaseGenerationOptions {
  specialty?: string
  difficulty?: "beginner" | "intermediate" | "advanced"
  forceRare?: boolean
  rareProbability?: number // Default 5-10%
  caseType?: "emergency" | "outpatient" | "chronic"
}

class CaseGenerationService {
  private specialties = [
    "Cardiology",
    "Neurology", 
    "Gastroenterology",
    "Pulmonology",
    "Endocrinology",
    "Rheumatology",
    "Hematology",
    "Oncology",
    "Infectious Disease",
    "General Surgery",
    "Orthopedics",
    "Dermatology",
    "Psychiatry",
    "Nephrology",
    "Urology"
  ]

  private patientNames = {
    male: ["John Smith", "Michael Johnson", "David Wilson", "Robert Brown", "James Davis", "William Miller", "Richard Garcia", "Charles Rodriguez", "Thomas Martinez", "Christopher Anderson"],
    female: ["Sarah Johnson", "Emily Davis", "Jessica Wilson", "Ashley Brown", "Amanda Miller", "Jennifer Garcia", "Elizabeth Rodriguez", "Michelle Martinez", "Kimberly Anderson", "Amy Taylor"]
  }

  private occupations = [
    "Office worker", "Teacher", "Engineer", "Nurse", "Sales representative", 
    "Accountant", "Software developer", "Construction worker", "Retail manager",
    "Graduate student", "Retired", "Freelancer", "Consultant", "Artist"
  ]

  /**
   * Generate a new medical case with probability for rare diseases
   */
  generateCase(options: CaseGenerationOptions = {}): MedicalCase {
    const {
      specialty,
      difficulty = "intermediate",
      forceRare = false,
      rareProbability = 0.08, // 8% chance for rare disease
      caseType
    } = options

    // Determine if this should be a rare disease case
    const isRare = forceRare || Math.random() < rareProbability
    
    // Select disease based on specialty if specified
    let diseaseName: string
    let selectedSpecialty: string
    
    if (specialty) {
      // Filter diseases by specialty first
      const specialtyDiseases = this.getDiseasesBySpecialty(specialty, isRare)
      if (specialtyDiseases.length === 0) {
        throw new Error(`No diseases found for specialty: ${specialty}`)
      }
      diseaseName = this.selectRandomDisease(specialtyDiseases)
      selectedSpecialty = specialty
    } else {
      // Select disease first, then specialty
      diseaseName = isRare 
        ? this.selectRandomDisease(rareDiseases)
        : this.selectRandomDisease(commonDiseases)
      selectedSpecialty = this.selectRandomSpecialty(diseaseName)
    }

    // Generate patient profile
    const gender = Math.random() < 0.5 ? "Male" : "Female"
    const patientProfile = this.generatePatientProfile(gender)

    // Generate case data based on disease
    const caseData = this.generateCaseData(diseaseName, isRare, selectedSpecialty)

    // Adjust case complexity based on difficulty and case type
    const adjustedCaseData = this.adjustCaseForDifficulty(caseData, difficulty, caseType)

    const baseCase: MedicalCase = {
      id: this.generateId(),
      title: this.generateTitle(diseaseName, isRare, caseType),
      description: this.generateDescription(patientProfile, adjustedCaseData.symptoms),
      difficulty,
      disease: diseaseName, // This is the hidden diseaseName
      diseaseName, // Hidden from student & AI doctor
      specialty: selectedSpecialty,
      isRare,
      symptoms: adjustedCaseData.symptoms,
      history: adjustedCaseData.history,
      labs: adjustedCaseData.labs,
      expectedQuestions: adjustedCaseData.expectedQuestions,
      patientProfile,
      createdAt: new Date().toISOString(),
    }

    // Enhance rare disease cases with subtle clues
    return isRare ? rareDiseaseService.enhanceRareDiseaseCase(baseCase) : baseCase
  }

  /**
   * Generate multiple cases with rare disease probability
   */
  generateCases(count: number, options: CaseGenerationOptions = {}): MedicalCase[] {
    const cases: MedicalCase[] = []
    for (let i = 0; i < count; i++) {
      cases.push(this.generateCase(options))
    }
    return cases
  }

  private selectRandomDisease(diseases: string[]): string {
    return diseases[Math.floor(Math.random() * diseases.length)]
  }

  private adjustCaseForDifficulty(caseData: any, difficulty: string, caseType?: string): any {
    const adjustedData = { ...caseData }
    
    switch (difficulty) {
      case "beginner":
        // Fewer symptoms, more obvious clues, simpler presentation
        adjustedData.symptoms = caseData.symptoms.slice(0, Math.min(3, caseData.symptoms.length))
        adjustedData.expectedQuestions = Math.max(3, Math.floor(caseData.expectedQuestions * 0.7))
        // Add more obvious clues to history
        adjustedData.history = caseData.history + " The patient reports a clear timeline of symptoms."
        break
        
      case "advanced":
        // More symptoms, complex presentation, multiple systems
        adjustedData.symptoms = [...caseData.symptoms]
        // Add additional symptoms for complexity
        const additionalSymptoms = [
          "fatigue", "weight loss", "night sweats", "joint pain", 
          "muscle weakness", "cognitive changes", "mood changes"
        ]
        const randomSymptom = additionalSymptoms[Math.floor(Math.random() * additionalSymptoms.length)]
        if (!adjustedData.symptoms.includes(randomSymptom)) {
          adjustedData.symptoms.push(randomSymptom)
        }
        adjustedData.expectedQuestions = Math.floor(caseData.expectedQuestions * 1.3)
        // Add complexity to history
        adjustedData.history = caseData.history + " The patient has a complex medical history with multiple comorbidities."
        break
        
      case "intermediate":
      default:
        // Keep original case data
        break
    }
    
    // Adjust for case type
    if (caseType) {
      switch (caseType) {
        case "emergency":
          // Add urgency to symptoms and history
          adjustedData.history = "EMERGENCY PRESENTATION: " + adjustedData.history
          adjustedData.symptoms = ["severe " + adjustedData.symptoms[0], ...adjustedData.symptoms.slice(1)]
          break
        case "chronic":
          // Add chronicity to history
          adjustedData.history = adjustedData.history + " This is a chronic condition with ongoing management."
          break
        case "outpatient":
        default:
          // Standard outpatient presentation
          break
      }
    }
    
    return adjustedData
  }

  private getDiseasesBySpecialty(specialty: string, isRare: boolean): string[] {
    // Map specialties to diseases
    const specialtyDiseaseMap: Record<string, string[]> = {
      "Cardiology": [
        "Myocardial Infarction", "Hypertension", "Heart Failure", "Atrial Fibrillation", 
        "Angina", "Cardiomyopathy", "Marfan Syndrome", "Aortic Stenosis"
      ],
      "Neurology": [
        "Stroke", "Epilepsy", "Multiple Sclerosis", "Parkinson's Disease", 
        "Alzheimer's Disease", "Migraine", "Huntington's Disease", "Wilson's Disease"
      ],
      "Gastroenterology": [
        "Appendicitis", "Crohn's Disease", "Ulcerative Colitis", "Peptic Ulcer", 
        "Gallstones", "Hepatitis", "Celiac Disease", "Gastroesophageal Reflux Disease",
        "Cholecystitis", "Diverticulitis", "Liver Cirrhosis"
      ],
      "Pulmonology": [
        "Pneumonia", "Asthma", "COPD", "Lung Cancer", "Pulmonary Embolism", 
        "Tuberculosis", "Pneumothorax", "Bronchitis"
      ],
      "Endocrinology": [
        "Diabetes Mellitus Type 2", "Diabetes Mellitus Type 1", "Thyroid Disorders", 
        "Addison's Disease", "Cushing's Syndrome", "Hyperthyroidism", "Hypothyroidism"
      ],
      "Rheumatology": [
        "Rheumatoid Arthritis", "Osteoarthritis", "Systemic Lupus Erythematosus", 
        "Sjögren's Syndrome", "Scleroderma", "Ehlers-Danlos Syndrome", "Fibromyalgia"
      ],
      "Hematology": [
        "Anemia", "Leukemia", "Lymphoma", "Hemophilia", "Thrombocytopenia", 
        "Sickle Cell Disease", "Multiple Myeloma"
      ],
      "Oncology": [
        "Breast Cancer", "Lung Cancer", "Colon Cancer", "Prostate Cancer", 
        "Leukemia", "Lymphoma", "Melanoma", "Pancreatic Cancer"
      ],
      "Infectious Disease": [
        "Pneumonia", "Sepsis", "Tuberculosis", "HIV/AIDS", "Hepatitis", 
        "Malaria", "Meningitis", "Endocarditis"
      ],
      "General Surgery": [
        "Appendicitis", "Gallstones", "Hernia", "Bowel Obstruction", 
        "Trauma", "Burns", "Cholecystitis"
      ],
      "Orthopedics": [
        "Fractures", "Osteoarthritis", "Rheumatoid Arthritis", "Osteoporosis", 
        "Spinal Disorders", "Sports Injuries", "Joint Replacement"
      ],
      "Dermatology": [
        "Eczema", "Psoriasis", "Acne", "Melanoma", "Basal Cell Carcinoma", 
        "Contact Dermatitis", "Vitiligo"
      ],
      "Psychiatry": [
        "Depression", "Anxiety", "Bipolar Disorder", "Schizophrenia", 
        "PTSD", "OCD", "Eating Disorders"
      ],
      "Nephrology": [
        "Chronic Kidney Disease", "Acute Kidney Injury", "Kidney Stones", 
        "Glomerulonephritis", "Polycystic Kidney Disease", "Nephrotic Syndrome"
      ],
      "Urology": [
        "Kidney Stones", "Prostate Cancer", "Benign Prostatic Hyperplasia", 
        "Urinary Tract Infection", "Bladder Cancer", "Erectile Dysfunction"
      ]
    }

    const diseases = specialtyDiseaseMap[specialty] || []
    
    if (isRare) {
      // Filter to only rare diseases for this specialty
      return diseases.filter(disease => 
        rareDiseases.includes(disease)
      )
    } else {
      // Filter to only common diseases for this specialty
      return diseases.filter(disease => 
        commonDiseases.includes(disease)
      )
    }
  }

  private selectRandomSpecialty(diseaseName: string): string {
    // Map diseases to specialties for more realistic cases
    const diseaseSpecialtyMap: Record<string, string[]> = {
      "Myocardial Infarction": ["Cardiology"],
      "Appendicitis": ["General Surgery"],
      "Pneumonia": ["Pulmonology", "Infectious Disease"],
      "Diabetes Mellitus Type 2": ["Endocrinology"],
      "Hypertension": ["Cardiology"],
      "Asthma": ["Pulmonology"],
      "COPD": ["Pulmonology"],
      "Marfan Syndrome": ["Cardiology", "Genetics"],
      "Addison's Disease": ["Endocrinology"],
      "Cushing's Syndrome": ["Endocrinology"],
      "Ehlers-Danlos Syndrome": ["Rheumatology", "Genetics"],
      "Huntington's Disease": ["Neurology", "Genetics"],
      "Wilson's Disease": ["Gastroenterology", "Neurology"],
      "Systemic Lupus Erythematosus": ["Rheumatology"],
      "Sjögren's Syndrome": ["Rheumatology"],
      "Scleroderma": ["Rheumatology"],
    }

    const specialties = diseaseSpecialtyMap[diseaseName] || this.specialties
    return specialties[Math.floor(Math.random() * specialties.length)]
  }

  private generatePatientProfile(gender: "Male" | "Female") {
    const names = this.patientNames[gender.toLowerCase() as keyof typeof this.patientNames]
    return {
      name: names[Math.floor(Math.random() * names.length)],
      age: Math.floor(Math.random() * 60) + 18, // 18-78 years old
      gender,
      occupation: this.occupations[Math.floor(Math.random() * this.occupations.length)]
    }
  }

  private generateCaseData(diseaseName: string, isRare: boolean, specialty: string) {
    // This would be expanded with actual medical knowledge
    // For now, using basic templates that can be enhanced
    const baseSymptoms = this.getBaseSymptoms(diseaseName)
    const history = this.getMedicalHistory(diseaseName)
    const labs = this.getLabResults(diseaseName)
    const expectedQuestions = this.getExpectedQuestions(diseaseName)

    return {
      symptoms: baseSymptoms,
      history,
      labs,
      expectedQuestions
    }
  }

  private getBaseSymptoms(diseaseName: string): string[] {
    const symptomMap: Record<string, string[]> = {
      // Cardiology
      "Myocardial Infarction": ["chest pain", "shortness of breath", "sweating", "nausea", "fatigue"],
      "Hypertension": ["headache", "dizziness", "fatigue", "chest pain", "shortness of breath"],
      "Heart Failure": ["shortness of breath", "fatigue", "swelling in legs", "chest pain", "rapid heartbeat"],
      "Atrial Fibrillation": ["irregular heartbeat", "chest pain", "shortness of breath", "fatigue", "dizziness"],
      
      // Gastroenterology
      "Appendicitis": ["abdominal pain", "fever", "nausea", "vomiting", "loss of appetite"],
      "Crohn's Disease": ["abdominal pain", "diarrhea", "weight loss", "fatigue", "fever"],
      "Ulcerative Colitis": ["abdominal pain", "bloody diarrhea", "urgency", "fatigue", "weight loss"],
      "Peptic Ulcer": ["abdominal pain", "nausea", "vomiting", "bloating", "heartburn"],
      "Gallstones": ["abdominal pain", "nausea", "vomiting", "fever", "jaundice"],
      "Hepatitis": ["fatigue", "jaundice", "abdominal pain", "nausea", "dark urine"],
      "Celiac Disease": ["abdominal pain", "diarrhea", "weight loss", "fatigue", "bloating"],
      "Gastroesophageal Reflux Disease": ["heartburn", "chest pain", "difficulty swallowing", "regurgitation", "chronic cough"],
      "Cholecystitis": ["abdominal pain", "fever", "nausea", "vomiting", "jaundice"],
      "Diverticulitis": ["abdominal pain", "fever", "nausea", "constipation", "bloating"],
      "Liver Cirrhosis": ["fatigue", "jaundice", "abdominal swelling", "easy bruising", "confusion"],
      
      // Pulmonology
      "Pneumonia": ["cough", "fever", "shortness of breath", "chest pain", "fatigue"],
      "Asthma": ["shortness of breath", "wheezing", "chest tightness", "cough", "fatigue"],
      "COPD": ["shortness of breath", "chronic cough", "chest tightness", "fatigue", "wheezing"],
      
      // Endocrinology
      "Diabetes Mellitus Type 2": ["increased thirst", "frequent urination", "fatigue", "blurred vision", "slow healing"],
      "Hypothyroidism": ["fatigue", "weight gain", "cold intolerance", "depression", "constipation"],
      "Hyperthyroidism": ["weight loss", "rapid heartbeat", "anxiety", "sweating", "tremor"],
      
      // Neurology
      "Stroke": ["sudden weakness", "speech difficulty", "facial drooping", "confusion", "headache"],
      "Migraine": ["severe headache", "nausea", "sensitivity to light", "fatigue", "dizziness"],
      
      // Rare Diseases
      "Marfan Syndrome": ["chest pain", "shortness of breath", "joint pain", "vision problems", "tall stature"],
      "Addison's Disease": ["fatigue", "weight loss", "darkening of skin", "low blood pressure", "salt craving"],
      "Cushing's Syndrome": ["weight gain", "moon face", "buffalo hump", "high blood pressure", "muscle weakness"],
      "Ehlers-Danlos Syndrome": ["joint hypermobility", "skin hyperextensibility", "easy bruising", "joint dislocations", "chronic pain"],
      "Huntington's Disease": ["involuntary movements", "cognitive decline", "mood changes", "difficulty swallowing", "speech problems"],
      "Wilson's Disease": ["abdominal pain", "fatigue", "jaundice", "tremor", "personality changes"]
    }

    const symptoms = symptomMap[diseaseName]
    if (!symptoms) {
      throw new Error(`No symptom map found for disease: ${diseaseName}`)
    }
    return symptoms
  }

  private getMedicalHistory(diseaseName: string): string[] {
    const historyMap: Record<string, string[]> = {
      "Myocardial Infarction": ["hypertension", "smoking history", "family history of heart disease", "diabetes"],
      "Appendicitis": ["no previous surgeries", "no known allergies", "healthy lifestyle"],
      "Pneumonia": ["COPD", "smoking history", "diabetes", "immunocompromised"],
      "Marfan Syndrome": ["family history of sudden cardiac death", "tall stature", "flexible joints", "vision problems"],
      "Addison's Disease": ["autoimmune conditions", "family history", "recent illness", "medication changes"],
      "Cushing's Syndrome": ["steroid use", "pituitary tumor", "adrenal tumor", "weight gain"],
      "Ehlers-Danlos Syndrome": ["family history", "joint problems", "skin issues", "vascular problems"],
      "Huntington's Disease": ["family history", "genetic testing", "neurological symptoms", "psychiatric history"],
      "Wilson's Disease": ["family history", "liver problems", "neurological symptoms", "copper metabolism issues"]
    }

    return historyMap[diseaseName] || ["no significant medical history"]
  }

  private getLabResults(diseaseName: string): Record<string, any> {
    const labMap: Record<string, Record<string, any>> = {
      "Myocardial Infarction": {
        "Troponin I": "elevated",
        "CK-MB": "elevated",
        "ECG": "ST elevation in leads II, III, aVF",
        "Chest X-ray": "normal"
      },
      "Appendicitis": {
        "WBC": "elevated",
        "CRP": "elevated",
        "CT Abdomen": "appendix wall thickening with periappendiceal fat stranding"
      },
      "Pneumonia": {
        "Chest X-ray": "consolidation in right lower lobe",
        "WBC": "elevated",
        "Blood cultures": "pending",
        "Sputum culture": "pending"
      },
      "Marfan Syndrome": {
        "Echocardiogram": "aortic root dilatation",
        "Slit-lamp exam": "lens dislocation",
        "Genetic testing": "FBN1 mutation positive"
      },
      "Addison's Disease": {
        "Cortisol": "low",
        "ACTH": "elevated",
        "Aldosterone": "low",
        "Renin": "elevated"
      },
      "Cushing's Syndrome": {
        "Cortisol": "elevated",
        "ACTH": "variable",
        "Dexamethasone suppression test": "abnormal",
        "24-hour urine cortisol": "elevated"
      },
      "Ehlers-Danlos Syndrome": {
        "Genetic testing": "COL5A1/COL5A2 mutations",
        "Skin biopsy": "collagen abnormalities",
        "Joint imaging": "hypermobility"
      },
      "Huntington's Disease": {
        "Genetic testing": "CAG repeat expansion",
        "Brain MRI": "caudate nucleus atrophy",
        "Neuropsychological testing": "cognitive impairment"
      },
      "Wilson's Disease": {
        "Serum copper": "low",
        "Urine copper": "elevated",
        "Ceruloplasmin": "low",
        "Genetic testing": "ATP7B mutations"
      }
    }

    return labMap[diseaseName] || { "Basic labs": "pending" }
  }

  private getExpectedQuestions(diseaseName: string): string[] {
    const questionMap: Record<string, string[]> = {
      "Myocardial Infarction": [
        "When did the pain start?",
        "Can you describe the pain?",
        "Do you have any medical history?",
        "Are you taking any medications?",
        "Do you smoke or drink alcohol?"
      ],
      "Appendicitis": [
        "Where exactly is the pain?",
        "When did it start?",
        "Have you had fever?",
        "Any nausea or vomiting?",
        "Any previous surgeries?"
      ],
      "Pneumonia": [
        "How long have you had the cough?",
        "Any sputum production?",
        "Do you have fever?",
        "Any recent travel?",
        "Do you smoke?"
      ],
      "Marfan Syndrome": [
        "Do you have any family history of heart problems?",
        "Have you noticed any changes in your vision?",
        "Are you unusually tall or flexible?",
        "Any joint problems?",
        "Any chest pain or palpitations?"
      ],
      "Addison's Disease": [
        "Have you been feeling more tired than usual?",
        "Any changes in your skin color?",
        "Do you crave salt?",
        "Any recent illnesses or stress?",
        "Are you taking any medications?"
      ],
      "Cushing's Syndrome": [
        "Have you gained weight recently?",
        "Any changes in your face shape?",
        "Do you have high blood pressure?",
        "Are you taking steroids?",
        "Any muscle weakness?"
      ],
      "Ehlers-Danlos Syndrome": [
        "Are you unusually flexible?",
        "Do you bruise easily?",
        "Any joint dislocations?",
        "Any family history of similar problems?",
        "Any skin problems?"
      ],
      "Huntington's Disease": [
        "Do you have any family history of neurological problems?",
        "Have you noticed any involuntary movements?",
        "Any changes in your mood or thinking?",
        "Any difficulty with coordination?",
        "Any speech problems?"
      ],
      "Wilson's Disease": [
        "Do you have any liver problems?",
        "Any neurological symptoms?",
        "Any changes in your eyes?",
        "Any family history of similar problems?",
        "Any psychiatric symptoms?"
      ]
    }

    return questionMap[diseaseName] || [
      "What brings you in today?",
      "When did your symptoms start?",
      "Can you describe your symptoms?",
      "Do you have any medical history?",
      "Are you taking any medications?"
    ]
  }

  private generateTitle(diseaseName: string, isRare: boolean, caseType?: string): string {
    if (isRare) {
      return `Rare Disease Case - ${diseaseName}`
    }
    
    const baseTitles = [
      "Chest Pain Case",
      "Abdominal Pain Case", 
      "Respiratory Symptoms",
      "Neurological Symptoms",
      "Endocrine Disorder",
      "Rheumatological Condition",
      "Hematological Disorder",
      "Infectious Disease Case"
    ]
    
    const baseTitle = baseTitles[Math.floor(Math.random() * baseTitles.length)]
    
    if (caseType) {
      switch (caseType) {
        case "emergency":
          return `Emergency ${baseTitle}`
        case "outpatient":
          return `Outpatient ${baseTitle}`
        case "chronic":
          return `Chronic ${baseTitle}`
        default:
          return baseTitle
      }
    }
    
    return baseTitle
  }

  private generateDescription(patientProfile: any, symptoms: string[]): string {
    const primarySymptom = symptoms[0] || "symptoms"
    return `A ${patientProfile.age}-year-old ${patientProfile.gender.toLowerCase()} patient presents with ${primarySymptom}`
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}

export const caseGenerationService = new CaseGenerationService()
