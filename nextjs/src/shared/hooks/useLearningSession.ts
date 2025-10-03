import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/shared/contexts/auth-context";
import {
  LearningSession,
  MedicalCase,
  ChatMessage,
  DoctorThought,
  LearningUIState,
  DoctorQuestionRequest,
  PatientResponseRequest,
  DoctorThoughtRequest,
  AskDoctorRequest,
} from "@/shared/types/learning.types";
import { learningService } from "@/shared/services/learning/learning.service";

interface UseLearningSessionProps {
  caseId: string;
  medicalCase: MedicalCase;
}

interface UseLearningSessionReturn {
  // Session data
  session: LearningSession | null;
  isLoading: boolean;
  error: string | null;

  // UI state
  uiState: LearningUIState;

  // Actions
  initializeSession: () => Promise<void>;
  addMessage: (message: ChatMessage) => Promise<void>;
  generateDoctorQuestion: () => Promise<void>;
  generatePatientResponse: (question: string) => Promise<void>;
  generateDoctorThought: (context: string) => Promise<void>;
  askDoctor: (question: string) => Promise<void>;
  completeSession: (score?: number, feedback?: string) => Promise<void>;

  // UI controls
  togglePlay: () => void;
  togglePause: () => void;
  setStudentQuestion: (question: string) => void;
  submitStudentQuestion: () => Promise<void>;
  toggleDoctorChat: () => void;
  toggleSection: (section: keyof LearningUIState["collapsedSections"]) => void;
  setActiveTab: (tab: keyof LearningUIState["activeTabs"]) => void;

  // Speech controls
  speakMessage: (message: ChatMessage) => void;
  stopSpeaking: () => void;
}

export const useLearningSession = ({
  caseId,
  medicalCase,
}: UseLearningSessionProps): UseLearningSessionReturn => {
  const { user } = useAuth();
  const [session, setSession] = useState<LearningSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uiState, setUIState] = useState<LearningUIState>({
    isPlaying: false,
    isPaused: false,
    studentQuestion: "",
    isProcessing: false,
    messages: [],
    isSpeaking: false,
    doctorThoughts: [],
    isDoctorChatOpen: false,
    collapsedSections: {
      patientInfo: false,
      vitalSigns: false,
      physicalExam: false,
      labResults: false,
      conversation: false,
      doctorThoughts: false,
    },
    activeTabs: {
      conversation: true,
      soapNote: false,
      progress: false,
    },
  });

  // Initialize session
  const initializeSession = useCallback(async () => {
    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newSession = await learningService.initializeSession(
        caseId,
        user.id
      );
      setSession(newSession);
      setUIState((prev) => ({
        ...prev,
        messages: newSession.conversation || [],
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize session"
      );
    } finally {
      setIsLoading(false);
    }
  }, [caseId, user?.id]);

  // Add message to conversation
  const addMessage = useCallback(
    async (message: ChatMessage) => {
      if (!session) return;

      const updatedMessages = [...uiState.messages, message];

      setUIState((prev) => ({
        ...prev,
        messages: updatedMessages,
      }));

      try {
        const updatedSession = await learningService.updateSessionConversation(
          session.id,
          updatedMessages
        );
        setSession(updatedSession);
      } catch (err) {
        console.error("Failed to update session:", err);
      }
    },
    [session, uiState.messages]
  );

  // Generate doctor question
  const generateDoctorQuestion = useCallback(async () => {
    if (!session || !medicalCase) return;

    setUIState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const request: DoctorQuestionRequest = {
        context: {
          caseId: session.caseId,
          disease: medicalCase.disease,
          symptoms: medicalCase.symptoms,
          patientProfile: medicalCase.patientProfile,
          conversationHistory: uiState.messages,
        },
        conversation: uiState.messages,
      };

      const response = await learningService.generateDoctorQuestion(request);

      const doctorMessage: ChatMessage = {
        id: `doctor-${Date.now()}`,
        role: "doctor",
        content: response.question,
        timestamp: new Date().toISOString(),
        explanation: response.explanation,
      };

      await addMessage(doctorMessage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate doctor question"
      );
    } finally {
      setUIState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [session, medicalCase, uiState.messages, addMessage]);

  // Generate patient response
  const generatePatientResponse = useCallback(
    async (question: string) => {
      if (!session || !medicalCase) return;

      setUIState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const request: PatientResponseRequest = {
          question,
          context: {
            caseId: session.caseId,
            disease: medicalCase.disease,
            symptoms: medicalCase.symptoms,
            patientProfile: medicalCase.patientProfile,
            conversationHistory: uiState.messages,
          },
        };

        const response = await learningService.generatePatientResponse(request);

        const patientMessage: ChatMessage = {
          id: `patient-${Date.now()}`,
          role: "patient",
          content: response.response,
          timestamp: new Date().toISOString(),
        };

        await addMessage(patientMessage);

        // If conversation is complete, mark session as complete
        if (response.isComplete) {
          await completeSession();
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate patient response"
        );
      } finally {
        setUIState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [session, medicalCase, uiState.messages, addMessage]
  );

  // Generate doctor thought
  const generateDoctorThought = useCallback(
    async (context: string) => {
      if (!session) return;

      try {
        const request: DoctorThoughtRequest = {
          context,
          conversation: uiState.messages,
          currentCase: medicalCase,
          patientInfo: medicalCase?.patientProfile,
        };

        const response = await learningService.generateDoctorThought(request);

        const thought: DoctorThought = {
          id: `thought-${Date.now()}`,
          content: response.thought,
          timestamp: new Date().toISOString(),
          context,
        };

        setUIState((prev) => ({
          ...prev,
          doctorThoughts: [...prev.doctorThoughts, thought],
        }));
      } catch (err) {
        console.error("Failed to generate doctor thought:", err);
      }
    },
    [session, medicalCase, uiState.messages]
  );

  // Ask doctor (student question)
  const askDoctor = useCallback(
    async (question: string) => {
      if (!session || !medicalCase) return;

      setUIState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const request: AskDoctorRequest = {
          question,
          context: {
            caseId: session.caseId,
            specialty: medicalCase.specialty,
            difficulty: medicalCase.difficulty,
            chiefComplaint: medicalCase.symptoms.join(", "),
            patientAge: medicalCase.patientProfile.age.toString(),
            patientGender: medicalCase.patientProfile.gender,
            patientOccupation: medicalCase.patientProfile.occupation,
            symptoms: medicalCase.symptoms,
            medicalHistory: medicalCase.history,
            vitalSigns: medicalCase.vitalSigns,
            physicalExam: medicalCase.physicalExam,
            labResults: medicalCase.labs,
            disease: medicalCase.disease,
            patientProfile: medicalCase.patientProfile,
            conversationHistory: uiState.messages,
          },
          conversation: uiState.messages,
        };

        const response = await learningService.askDoctor(request);

        const doctorResponse: ChatMessage = {
          id: `doctor-response-${Date.now()}`,
          role: "doctor",
          content: response.response,
          timestamp: new Date().toISOString(),
        };

        await addMessage(doctorResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to ask doctor");
      } finally {
        setUIState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [session, medicalCase, uiState.messages, addMessage]
  );

  // Complete session
  const completeSession = useCallback(
    async (score?: number, feedback?: string) => {
      if (!session) return;

      try {
        const completedSession = await learningService.completeSession(
          session.id,
          score,
          feedback
        );
        setSession(completedSession);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to complete session"
        );
      }
    },
    [session]
  );

  // UI Controls
  const togglePlay = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
      isPaused: false,
    }));
  }, []);

  const togglePause = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const setStudentQuestion = useCallback((question: string) => {
    setUIState((prev) => ({ ...prev, studentQuestion: question }));
  }, []);

  const submitStudentQuestion = useCallback(async () => {
    if (!uiState.studentQuestion.trim()) return;

    const studentMessage: ChatMessage = {
      id: `student-${Date.now()}`,
      role: "student",
      content: uiState.studentQuestion,
      timestamp: new Date().toISOString(),
    };

    await addMessage(studentMessage);
    await askDoctor(uiState.studentQuestion);

    setUIState((prev) => ({ ...prev, studentQuestion: "" }));
  }, [uiState.studentQuestion, addMessage, askDoctor]);

  const toggleDoctorChat = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      isDoctorChatOpen: !prev.isDoctorChatOpen,
    }));
  }, []);

  const toggleSection = useCallback(
    (section: keyof LearningUIState["collapsedSections"]) => {
      setUIState((prev) => ({
        ...prev,
        collapsedSections: {
          ...prev.collapsedSections,
          [section]: !prev.collapsedSections[section],
        },
      }));
    },
    []
  );

  const setActiveTab = useCallback(
    (tab: keyof LearningUIState["activeTabs"]) => {
      setUIState((prev) => ({
        ...prev,
        activeTabs: {
          conversation: false,
          soapNote: false,
          progress: false,
          [tab]: true,
        },
      }));
    },
    []
  );

  // Speech controls
  const speakMessage = useCallback((message: ChatMessage) => {
    learningService.speak(message.content, () => {
      setUIState((prev) => ({ ...prev, isSpeaking: false }));
    });
    setUIState((prev) => ({ ...prev, isSpeaking: true }));
  }, []);

  const stopSpeaking = useCallback(() => {
    learningService.stopSpeaking();
    setUIState((prev) => ({ ...prev, isSpeaking: false }));
  }, []);

  // Initialize session on mount
  useEffect(() => {
    if (user?.id && medicalCase) {
      initializeSession();
    }
  }, [user?.id, medicalCase, initializeSession]);

  return {
    // Session data
    session,
    isLoading,
    error,

    // UI state
    uiState,

    // Actions
    initializeSession,
    addMessage,
    generateDoctorQuestion,
    generatePatientResponse,
    generateDoctorThought,
    askDoctor,
    completeSession,

    // UI controls
    togglePlay,
    togglePause,
    setStudentQuestion,
    submitStudentQuestion,
    toggleDoctorChat,
    toggleSection,
    setActiveTab,

    // Speech controls
    speakMessage,
    stopSpeaking,
  };
};
