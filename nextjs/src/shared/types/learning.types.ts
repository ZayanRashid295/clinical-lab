// Learning Module Types for Shadow Mode
// Based on the learning-mode-module analysis

export interface MedicalCase {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  disease: string;
  diseaseName: string;
  specialty: string;
  isRare: boolean;
  symptoms: string[];
  history: string[];
  labs?: Record<string, any>;
  expectedQuestions?: string[];
  patientProfile: {
    name: string;
    age: number;
    gender: string;
    occupation: string;
  };
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: string;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  } | null;
  physicalExam?: {
    general?: string;
    cardiovascular?: string;
    respiratory?: string;
    abdominal?: string;
    neurological?: string;
  } | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "doctor" | "patient" | "student";
  content: string;
  timestamp: string;
  explanation?: string;
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  currentPhase: "history" | "examination" | "diagnosis" | "treatment";
  isComplete: boolean;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface StudentProgress {
  caseId: string;
  completedPhases: string[];
  currentPhase: string;
  score: number;
  feedback: string[];
}

export interface LearningSession {
  id: string;
  caseId: string;
  disease: string;
  patientProfile: any;
  conversation: ChatMessage[];
  isComplete: boolean;
  score?: number;
  feedback?: string;
  soapNote?: SOAPNote;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorThought {
  id: string;
  content: string;
  timestamp: string;
  context: string;
}

export interface LearningProgress {
  userId: string;
  completedCases: string[];
  inProgressCases: string[];
  totalScore: number;
  lastActivity: string;
}

// API Request/Response Types
export interface CreateLearningSessionRequest {
  userId: string;
  caseId: string;
  conversation: ChatMessage[];
  isComplete?: boolean;
  score?: number;
  feedback?: string;
  soapNote?: string;
}

export interface DoctorQuestionRequest {
  context: {
    caseId: string;
    disease: string;
    symptoms: string[];
    patientProfile?: any;
    conversationHistory: ChatMessage[];
  };
  conversation: ChatMessage[];
}

export interface DoctorQuestionResponse {
  question: string;
  explanation: string;
}

export interface PatientResponseRequest {
  question: string;
  context: {
    caseId: string;
    disease: string;
    symptoms: string[];
    patientProfile?: any;
    conversationHistory: ChatMessage[];
  };
  instruction?: string;
  isComplete?: boolean;
}

export interface PatientResponseResponse {
  response: string;
  isComplete: boolean;
}

export interface DoctorThoughtRequest {
  context: string;
  conversation: ChatMessage[];
  currentCase?: any;
  patientInfo?: any;
  instruction?: string;
}

export interface DoctorThoughtResponse {
  thought: string;
}

export interface AskDoctorRequest {
  question: string;
  context: {
    caseId: string;
    specialty: string;
    difficulty: string;
    chiefComplaint: string;
    patientAge: string;
    patientGender: string;
    patientOccupation: string;
    symptoms: string[];
    medicalHistory: string[];
    vitalSigns?: any;
    physicalExam?: any;
    labResults?: any;
    disease: string;
    patientProfile: any;
    conversationHistory: ChatMessage[];
  };
  conversation: ChatMessage[];
}

export interface AskDoctorResponse {
  response: string;
}

// UI State Types
export interface LearningUIState {
  isPlaying: boolean;
  isPaused: boolean;
  studentQuestion: string;
  isProcessing: boolean;
  messages: ChatMessage[];
  isSpeaking: boolean;
  doctorThoughts: DoctorThought[];
  isDoctorChatOpen: boolean;
  collapsedSections: {
    patientInfo: boolean;
    vitalSigns: boolean;
    physicalExam: boolean;
    labResults: boolean;
    conversation: boolean;
    doctorThoughts: boolean;
  };
  activeTabs: {
    conversation: boolean;
    soapNote: boolean;
    progress: boolean;
  };
}

// Component Props Types
export interface LearningInterfaceProps {
  session: LearningSession;
  onSessionUpdate: (session: LearningSession) => void;
  medicalCase: MedicalCase;
  isFullScreen?: boolean;
}

export interface ConversationPanelProps {
  messages: ChatMessage[];
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStudentQuestion: (question: string) => void;
  studentQuestion: string;
  isProcessing: boolean;
}

export interface PatientInfoPanelProps {
  medicalCase: MedicalCase;
  collapsedSections: LearningUIState["collapsedSections"];
  onToggleSection: (
    section: keyof LearningUIState["collapsedSections"]
  ) => void;
}

export interface DoctorThoughtsPanelProps {
  thoughts: DoctorThought[];
  isOpen: boolean;
  onToggle: () => void;
}

export interface SOAPNotePanelProps {
  soapNote?: SOAPNote;
  isActive: boolean;
  onUpdate: (soapNote: SOAPNote) => void;
}

export interface ProgressPanelProps {
  progress: StudentProgress;
  isActive: boolean;
  onUpdate: (progress: StudentProgress) => void;
}
