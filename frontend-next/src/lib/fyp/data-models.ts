export interface MedicalCase {
  id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  disease: string // This is now the hidden diseaseName
  diseaseName: string // Hidden from student & AI doctor - the true diagnosis
  specialty: string // e.g., cardiology, neurology, gastroenterology
  isRare: boolean // true if rare disease case
  symptoms: string[]
  history: string[] // Medical history items
  labs: Record<string, any> // Laboratory results
  expectedQuestions: string[]
  patientProfile: {
    name: string
    age: number
    gender: string
    occupation: string
  }
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: "student" | "patient" | "doctor"
  content: string
  timestamp: string
  isIntervention?: boolean
  relevanceScore?: number
}

export interface Conversation {
  id: string
  studentId: string
  caseId: string
  messages: ChatMessage[]
  status: "active" | "completed" | "abandoned"
  startedAt: string
  completedAt?: string
  interventionCount: number
}

export interface ConversationContext {
  caseId: string
  disease: string // This is the hidden diseaseName
  diseaseName: string // Hidden from student & AI doctor
  specialty: string
  isRare: boolean
  symptoms: string[]
  history: string[]
  labs: Record<string, any>
  patientProfile: {
    name: string
    age: number
    gender: string
    occupation: string
  }
  conversationHistory: Array<{
    role: "student" | "patient" | "doctor"
    content: string
    timestamp: string
  }>
}

export interface SOAPNote {
  id: string
  conversationId: string
  studentId: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  submittedAt: string
  grade?: number
  feedback?: string
  aiGeneratedSOAP?: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
}

export interface StudentProgress {
  studentId: string
  casesCompleted: number
  averageGrade: number
  totalInterventions: number
  strengths: string[]
  areasForImprovement: string[]
  lastActivity: string
}

// Gamification interfaces
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: "completion" | "quality" | "speed" | "streak" | "specialty" | "rare" | "social"
  requirement: {
    type: "cases_completed" | "perfect_soap" | "speed_run" | "streak" | "specialty_master" | "no_interventions" | "daily_login"
    value: number
    timeframe?: "daily" | "weekly" | "monthly" | "all_time"
  }
  points: number
  rarity: "common" | "rare" | "epic" | "legendary"
  unlocked: boolean
  unlockedAt?: string
}

export interface UserLevel {
  level: number
  experience: number
  nextLevelExp: number
  title: string
  color: string
  unlockedFeatures: string[]
}

export interface DailyChallenge {
  id: string
  title: string
  description: string
  type: "cases" | "score" | "speed" | "specialty" | "streak"
  target: number
  current: number
  reward: {
    points: number
    experience: number
    achievementId?: string
  }
  expiresAt: string
  completed: boolean
}

export interface GamificationData {
  userId: string
  totalPoints: number
  experience: number
  level: number
  streak: number
  achievements: Achievement[]
  dailyChallenges: DailyChallenge[]
  lastActivity: string
  totalCasesCompleted: number
  specialtyMastery: Record<string, number>
}

export interface DiagnosisSubmission {
  id: string
  conversationId: string
  studentId: string
  submittedDiagnosis: string
  actualDiagnosis: string // Hidden diseaseName
  isCorrect: boolean
  submittedAt: string
  caseMetadata: {
    isRare: boolean
    specialty: string
    difficulty: string
  }
}

// Rare diseases pool for case generation
export const rareDiseases = [
  "Marfan Syndrome",
  "Addison's Disease", 
  "Cushing's Syndrome",
  "Ehlers-Danlos Syndrome",
  "Huntington's Disease",
  "Wilson's Disease",
  "Gaucher Disease",
  "Fabry Disease",
  "Pompe Disease",
  "Niemann-Pick Disease",
  "Tay-Sachs Disease",
  "Cystic Fibrosis",
  "Sickle Cell Disease",
  "Thalassemia",
  "Hemophilia",
  "Von Willebrand Disease",
  "Factor V Leiden",
  "Protein C Deficiency",
  "Antithrombin III Deficiency",
  "Systemic Lupus Erythematosus",
  "Sjögren's Syndrome",
  "Scleroderma",
  "Mixed Connective Tissue Disease",
  "Polymyositis",
  "Dermatomyositis",
  "Vasculitis",
  "Behçet's Disease",
  "Sarcoidosis",
  "Amyloidosis",
  "Hemochromatosis"
]

// Common diseases pool for regular cases
export const commonDiseases = [
  "Myocardial Infarction",
  "Appendicitis", 
  "Pneumonia",
  "Diabetes Mellitus Type 2",
  "Hypertension",
  "Asthma",
  "COPD",
  "Gastroesophageal Reflux Disease",
  "Peptic Ulcer Disease",
  "Cholecystitis",
  "Diverticulitis",
  "Urinary Tract Infection",
  "Migraine",
  "Depression",
  "Anxiety Disorder",
  "Osteoarthritis",
  "Rheumatoid Arthritis",
  "Hypothyroidism",
  "Hyperthyroidism",
  "Anemia",
  "Atrial Fibrillation",
  "Heart Failure",
  "Stroke",
  "Chronic Kidney Disease",
  "Liver Cirrhosis"
]

// Sample medical cases
export const sampleCases: MedicalCase[] = [
  {
    id: "1",
    title: "Chest Pain Case",
    description: "A 45-year-old patient presents with acute chest pain",
    difficulty: "intermediate",
    disease: "Myocardial Infarction", // This is the hidden diseaseName
    diseaseName: "Myocardial Infarction", // Hidden from student & AI doctor
    specialty: "Cardiology",
    isRare: false,
    symptoms: ["chest pain", "shortness of breath", "sweating", "nausea"],
    history: ["hypertension", "smoking history", "family history of heart disease"],
    labs: {
      "Troponin I": "elevated",
      "CK-MB": "elevated", 
      "ECG": "ST elevation in leads II, III, aVF",
      "Chest X-ray": "normal"
    },
    expectedQuestions: [
      "When did the pain start?",
      "Can you describe the pain?",
      "Do you have any medical history?",
      "Are you taking any medications?",
      "Do you smoke or drink alcohol?",
    ],
    patientProfile: {
      name: "John Smith",
      age: 45,
      gender: "Male",
      occupation: "Office worker",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Abdominal Pain Case",
    description: "A 28-year-old patient with severe abdominal pain",
    difficulty: "beginner",
    disease: "Appendicitis", // This is the hidden diseaseName
    diseaseName: "Appendicitis", // Hidden from student & AI doctor
    specialty: "General Surgery",
    isRare: false,
    symptoms: ["abdominal pain", "fever", "nausea", "vomiting"],
    history: ["no previous surgeries", "no known allergies"],
    labs: {
      "WBC": "elevated",
      "CRP": "elevated",
      "CT Abdomen": "appendix wall thickening with periappendiceal fat stranding"
    },
    expectedQuestions: [
      "Where exactly is the pain?",
      "When did it start?",
      "Have you had fever?",
      "Any nausea or vomiting?",
      "Any previous surgeries?",
    ],
    patientProfile: {
      name: "Sarah Johnson",
      age: 28,
      gender: "Female",
      occupation: "Teacher",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Respiratory Symptoms",
    description: "A 65-year-old patient with breathing difficulties",
    difficulty: "advanced",
    disease: "Pneumonia", // This is the hidden diseaseName
    diseaseName: "Pneumonia", // Hidden from student & AI doctor
    specialty: "Pulmonology",
    isRare: false,
    symptoms: ["cough", "fever", "shortness of breath", "chest pain"],
    history: ["COPD", "smoking history", "diabetes"],
    labs: {
      "Chest X-ray": "consolidation in right lower lobe",
      "WBC": "elevated",
      "Blood cultures": "pending",
      "Sputum culture": "pending"
    },
    expectedQuestions: [
      "How long have you had the cough?",
      "Any sputum production?",
      "Do you have fever?",
      "Any recent travel?",
      "Do you smoke?",
    ],
    patientProfile: {
      name: "Robert Wilson",
      age: 65,
      gender: "Male",
      occupation: "Retired",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Rare Disease Case - Marfan Syndrome",
    description: "A 25-year-old patient with unusual physical features and cardiovascular concerns",
    difficulty: "advanced",
    disease: "Marfan Syndrome", // This is the hidden diseaseName
    diseaseName: "Marfan Syndrome", // Hidden from student & AI doctor
    specialty: "Cardiology/Genetics",
    isRare: true,
    symptoms: ["chest pain", "shortness of breath", "joint pain", "vision problems"],
    history: ["family history of sudden cardiac death", "tall stature", "flexible joints"],
    labs: {
      "Echocardiogram": "aortic root dilatation",
      "Slit-lamp exam": "lens dislocation",
      "Genetic testing": "FBN1 mutation positive"
    },
    expectedQuestions: [
      "Do you have any family history of heart problems?",
      "Have you noticed any changes in your vision?",
      "Are you unusually tall or flexible?",
      "Any joint problems?",
      "Any chest pain or palpitations?",
    ],
    patientProfile: {
      name: "Alex Chen",
      age: 25,
      gender: "Male",
      occupation: "Graduate student",
    },
    createdAt: new Date().toISOString(),
  },
  
]
