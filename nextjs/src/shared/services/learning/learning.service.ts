import {
  MedicalCase,
  LearningSession,
  CreateLearningSessionRequest,
  DoctorQuestionRequest,
  DoctorQuestionResponse,
  PatientResponseRequest,
  PatientResponseResponse,
  DoctorThoughtRequest,
  DoctorThoughtResponse,
  AskDoctorRequest,
  AskDoctorResponse,
  LearningProgress,
  ChatMessage,
} from "@/shared/types/learning.types";
import { environment } from "@/environments/environment";

class LearningService {
  private baseUrl: string;

  constructor() {
    // Use the backend URL from environment configuration
    this.baseUrl = environment.backendUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get token from localStorage or context
    const token = localStorage.getItem("authToken");

    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Learning Cases
  async getAllCases(): Promise<MedicalCase[]> {
    return this.makeRequest<MedicalCase[]>("/learning/cases");
  }

  async getCaseById(id: string): Promise<MedicalCase> {
    return this.makeRequest<MedicalCase>(`/learning/cases/${id}`);
  }

  async createCase(caseData: Partial<MedicalCase>): Promise<MedicalCase> {
    return this.makeRequest<MedicalCase>("/learning/cases", {
      method: "POST",
      body: JSON.stringify(caseData),
    });
  }

  // Learning Sessions
  async createSession(
    sessionData: CreateLearningSessionRequest
  ): Promise<LearningSession> {
    return this.makeRequest<LearningSession>("/learning/sessions", {
      method: "POST",
      body: JSON.stringify(sessionData),
    });
  }

  async getAllSessions(): Promise<LearningSession[]> {
    return this.makeRequest<LearningSession[]>("/learning/sessions");
  }

  async getSessionById(id: string): Promise<LearningSession> {
    return this.makeRequest<LearningSession>(`/learning/sessions/${id}`);
  }

  async updateSession(
    id: string,
    updateData: Partial<CreateLearningSessionRequest>
  ): Promise<LearningSession> {
    return this.makeRequest<LearningSession>(`/learning/sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  // AI Interaction Methods
  async generateDoctorQuestion(
    request: DoctorQuestionRequest
  ): Promise<DoctorQuestionResponse> {
    return this.makeRequest<DoctorQuestionResponse>(
      "/learning/doctor-question",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  async generatePatientResponse(
    request: PatientResponseRequest
  ): Promise<PatientResponseResponse> {
    return this.makeRequest<PatientResponseResponse>(
      "/learning/patient-response",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  async generateDoctorThought(
    request: DoctorThoughtRequest
  ): Promise<DoctorThoughtResponse> {
    return this.makeRequest<DoctorThoughtResponse>("/learning/doctor-thought", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async askDoctor(request: AskDoctorRequest): Promise<AskDoctorResponse> {
    return this.makeRequest<AskDoctorResponse>("/learning/ask-doctor", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Learning Progress
  async getLearningProgress(): Promise<LearningProgress> {
    return this.makeRequest<LearningProgress>("/learning/progress");
  }

  async updateLearningProgress(
    caseId: string,
    isComplete: boolean
  ): Promise<LearningProgress> {
    return this.makeRequest<LearningProgress>("/learning/progress", {
      method: "POST",
      body: JSON.stringify({ caseId, isComplete }),
    });
  }

  // Utility Methods
  async checkAPIKey(): Promise<boolean> {
    try {
      // This would typically be a health check endpoint
      // For now, we'll just try to make a simple request
      await this.getAllCases();
      return true;
    } catch (error) {
      console.error("API key check failed:", error);
      return false;
    }
  }

  // Speech Synthesis (Web Speech API)
  speak(text: string, onEnd?: () => void): void {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      if (onEnd) {
        utterance.onend = onEnd;
      }

      speechSynthesis.speak(utterance);
    }
  }

  stopSpeaking(): void {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
  }

  // Local Storage Helpers
  saveSessionToLocalStorage(session: LearningSession): void {
    localStorage.setItem(`learn_${session.caseId}`, JSON.stringify(session));
  }

  loadSessionFromLocalStorage(caseId: string): LearningSession | null {
    try {
      const saved = localStorage.getItem(`learn_${caseId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error loading session from localStorage:", error);
      return null;
    }
  }

  // Session Management
  async initializeSession(
    caseId: string,
    userId: string
  ): Promise<LearningSession> {
    // Try to load existing session from localStorage first
    const existingSession = this.loadSessionFromLocalStorage(caseId);
    if (existingSession) {
      return existingSession;
    }

    // Create new session
    const newSession: CreateLearningSessionRequest = {
      userId,
      caseId,
      conversation: [],
      isComplete: false,
    };

    const session = await this.createSession(newSession);
    this.saveSessionToLocalStorage(session);
    return session;
  }

  async updateSessionConversation(
    sessionId: string,
    conversation: ChatMessage[]
  ): Promise<LearningSession> {
    const updatedSession = await this.updateSession(sessionId, {
      conversation,
    });
    this.saveSessionToLocalStorage(updatedSession);
    return updatedSession;
  }

  async completeSession(
    sessionId: string,
    score?: number,
    feedback?: string,
    soapNote?: string
  ): Promise<LearningSession> {
    const completedSession = await this.updateSession(sessionId, {
      isComplete: true,
      score,
      feedback,
      soapNote,
    });
    this.saveSessionToLocalStorage(completedSession);
    return completedSession;
  }
}

// Export singleton instance
export const learningService = new LearningService();
export default learningService;
