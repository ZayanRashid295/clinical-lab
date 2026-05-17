import { create } from 'zustand';

import type { StructuredTestReport } from "@/lib/medprep-shadow/shadow-test-report"

export interface Report {
  id?: string;
  type: string;
  summary?: string;
  fullReport?: string;
  reportContent?: string; // LLM-generated full report with test-specific sections
  timestamp: string;
  patientInfo?: unknown;
  structured?: StructuredTestReport;
  reportCategory?: string;
  // Legacy fields (may still be used in some places)
  findings?: string;
  impression?: string;
  recommendations?: string;
  questionIndex?: number; // Track which conversation turn (doctor question) generated this report
  conversationLength?: number; // Track conversation length when report was generated
}

export interface ShadowCycle {
  cycleId: string
  timestamp: string
  doctorQuestion: string
  doctorThought: string
  doctorDifferentialDiagnosis: unknown[]
  patientResponse: string
  postResponseDifferentialDiagnosis: unknown[]
  reports: Report[]
  reportsError?: string
}

// New replay mode state structure
export interface ReplayState {
  id: string;
  stateNumber: number;
  timestamp: string;
  type: 'doctor-turn' | 'patient-turn' | 'reports-generated' | 'soap-note' | 'prescription' | 'report';
  
  // Mode information - tracks which mode was active when this state was created
  mode?: 'normal' | 'student' | 'debug' | 'patient-info' | string;
  
  // Doctor Turn State (Question + Thought + Differential Diagnosis)
  doctorQuestion?: string;
  doctorThought?: string;
  doctorDifferentialDiagnosis?: any[];
  
  // Supervisor Intervention (if any)
  intervention?: {
    id: string;
    timestamp: string;
    role: string;
    question?: string;
    reason: string;
    content: string;
  };
  
  // Patient Turn State (Response + Post-Response Differential Diagnosis)
  patientResponse?: string;
  postResponseDifferentialDiagnosis?: any[];
  
  // SOAP Note State
  soapNote?: string;
  
  // Prescription State
  prescription?: string;
  
  // Individual Report State (for final reports generated from SOAP Plan)
  reportType?: string;
  reportContent?: string;
  
  // Reports generated in this specific state (legacy)
  reports: Report[];
  
  // Navigation state
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface ShadowStateFrame {
  id: string;
  type: "doctor-turn" | "report";
  timestamp: string;
  doctorQuestion?: string;
  doctorThought?: string;
  patientResponse?: string;
  differentialDiagnosis?: any[];
  postResponseDifferentialDiagnosis?: any[];
  generatedReports?: Report[];
  // For report frames
  reports?: Report[];
  sourceThoughtId?: string;
}

export interface InitialSessionData {
  conversation: any[];
  soapNote: string;
  prescription: string;
  reports: Report[];
  differentialDiagnosis: any[];
  doctorThoughts: any[];
  timestamp: string;
}

interface ShadowModeStore {
  // Timeline state
  currentStep: number;
  states: ShadowCycle[];
  liveMode: boolean;
  isAdvancing: boolean;
  
  // Current active mode for filtering replay states
  currentReplayMode?: string;
  
  // Report confirmation flow
  pendingRecommendedTests: string[] | null;
  pendingFrame: Omit<ShadowCycle, 'reports'> | null;
  
  // Report cache (persistent across cycles) - changed to array to allow multiple reports of same type
  reportCache: Report[];
  
  // Replay mode state
  replayMode: boolean;
  replayStates: ReplayState[];
  currentReplayStep: number;
  isReplayMode: boolean;
  
  // Actions
  addState: (frame: ShadowCycle) => void;
  addReportState: (reports: Report[], sourceThoughtId?: string) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  setLiveMode: (mode: boolean) => void;
  setIsAdvancing: (advancing: boolean) => void;
  setPendingRecommendedTests: (tests: string[] | null, frame: Omit<ShadowCycle, 'reports'> | null) => void;
  setPendingFrame: (frame: Omit<ShadowCycle, 'reports'> | null) => void;
  addReportToCache: (report: Report) => void;
  getReportFromCache: (type: string) => Report | null;
  setReportInCache: (report: Report) => void;
  getAllReports: () => Report[];
  clearPending: () => void;
  
  // Replay mode actions
  startReplayMode: (mode?: string) => void;
  exitReplayMode: () => void;
  addReplayState: (state: ReplayState, options?: { advanceStep?: boolean }) => void;
  nextReplayState: () => void;
  prevReplayState: () => void;
  getCurrentReplayState: () => ReplayState | null;
  getCurrentStateReports: () => Report[];
  getFilteredReplayStates: () => ReplayState[];

  // Session phase tracking (initial vs follow-up consultation)
  sessionPhase?: 'initial' | 'follow-up';
  initialSessionData?: InitialSessionData | null;
  followUpSessionData?: InitialSessionData | null;
  moveToFollowUp?: (initialData: InitialSessionData) => void;
  saveFollowUpSession?: (followUpData: InitialSessionData) => void;
  resetToInitialPhase?: () => void;
  getSessionPhase?: () => 'initial' | 'follow-up';
  getInitialSessionData?: () => InitialSessionData | null;
  getFollowUpSessionData?: () => InitialSessionData | null;
}

export const useShadowModeStore = create<ShadowModeStore>()((set, get) => ({
      // Initial state
      currentStep: 0,
      states: [],
      liveMode: true,
      isAdvancing: false,
      pendingRecommendedTests: null,
      pendingFrame: null,
      reportCache: [],
      
      // Replay mode initial state
      replayMode: false,
      replayStates: [],
      currentReplayStep: 0,
      isReplayMode: false,

      // Session phase initial state
      sessionPhase: 'initial',
      initialSessionData: null,
      followUpSessionData: null,

      // Actions
      addState: (frame: ShadowCycle) => {
        set((state) => ({
          states: [...state.states, frame],
          currentStep: state.states.length, // Move to the new state
        }));
      },

      addReportState: (reports: Report[], sourceThoughtId?: string) => {
        const reportFrame: ShadowStateFrame = {
          id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: "report",
          timestamp: new Date().toISOString(),
          reports,
          sourceThoughtId,
        };
        
        // Add to states array (this will be used for timeline)
        set((state) => ({
          states: [...state.states, {
            cycleId: reportFrame.id,
            timestamp: reportFrame.timestamp,
            doctorQuestion: "",
            doctorThought: "",
            doctorDifferentialDiagnosis: [],
            patientResponse: "",
            postResponseDifferentialDiagnosis: [],
            reports: reports,
          }],
          currentStep: state.states.length,
        }));
      },

      next: () => {
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.states.length),
        }));
      },

      prev: () => {
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        }));
      },

      reset: () => {
        set({
          currentStep: 0,
          states: [],
          liveMode: true,
          isAdvancing: false,
          pendingRecommendedTests: null,
          pendingFrame: null,
          reportCache: [],
          // Also reset replay mode state
          replayMode: false,
          replayStates: [],
          currentReplayStep: 0,
          isReplayMode: false,
          // Reset session phase data
          sessionPhase: 'initial',
          initialSessionData: null,
          followUpSessionData: null,
        });
      },

      setLiveMode: (mode: boolean) => {
        set({ liveMode: mode });
      },

      setIsAdvancing: (advancing: boolean) => {
        set({ isAdvancing: advancing });
      },

      setPendingRecommendedTests: (tests: string[] | null, frame: Omit<ShadowCycle, 'reports'> | null) => {
        set({ 
          pendingRecommendedTests: tests,
          pendingFrame: frame
        });
      },

      setPendingFrame: (frame: Omit<ShadowCycle, 'reports'> | null) => {
        set({ pendingFrame: frame });
      },

      addReportToCache: (report: Report) => {
        set((state) => ({
          reportCache: [...state.reportCache, report]
        }));
      },

      getReportFromCache: (type: string) => {
        // Find the most recent report of this type
        const reports = get().reportCache;
        const matchingReports = reports.filter(r => r.type === type);
        return matchingReports.length > 0 ? matchingReports[matchingReports.length - 1] : null;
      },

      setReportInCache: (report: Report) => {
        set((state) => ({
          reportCache: [...state.reportCache, report]
        }));
      },

      getAllReports: () => {
        const state = get() as any;
        const cached: Report[] = state.reportCache || [];
        if ((state.sessionPhase === 'follow-up') && cached.length === 0) {
          const initialReports: Report[] = (state.initialSessionData?.reports || []) as Report[];
          return initialReports;
        }
        return cached;
      },

      clearPending: () => {
        set({
          pendingRecommendedTests: null,
          pendingFrame: null
        });
      },

      // Replay mode actions
      startReplayMode: (mode?: string) => {
        set({
          isReplayMode: true,
          replayMode: true,
          currentReplayStep: 0,
          currentReplayMode: mode || 'normal'
          // Don't clear replayStates here - let them be populated by addReplayState
        });
      },

      exitReplayMode: () => {
        set({
          isReplayMode: false,
          replayMode: false,
          currentReplayStep: 0,
          replayStates: [],
          currentReplayMode: undefined
        });
      },

      addReplayState: (state: ReplayState, options?: { advanceStep?: boolean }) => {
        set((currentState) => {
          const newStates = [...currentState.replayStates, state];
          const advance = options?.advanceStep !== false;
          return {
            replayStates: newStates,
            currentReplayStep: advance
              ? newStates.length - 1
              : currentState.currentReplayStep,
          };
        });
      },

      nextReplayState: () => {
        set((state) => ({
          currentReplayStep: Math.min(state.currentReplayStep + 1, state.replayStates.length - 1)
        }));
      },

      prevReplayState: () => {
        set((state) => ({
          currentReplayStep: Math.max(state.currentReplayStep - 1, 0)
        }));
      },

      getCurrentReplayState: () => {
        const state = get();
        const filteredStates = state.currentReplayMode 
          ? state.replayStates.filter(s => (s.mode || 'normal') === state.currentReplayMode)
          : state.replayStates;
        return filteredStates[state.currentReplayStep] || null;
      },
      
      getFilteredReplayStates: () => {
        const state = get();
        return state.currentReplayMode 
          ? state.replayStates.filter(s => (s.mode || 'normal') === state.currentReplayMode)
          : state.replayStates;
      },

      getCurrentStateReports: () => {
        const state = get();
        const filteredStates = state.currentReplayMode 
          ? state.replayStates.filter(s => (s.mode || 'normal') === state.currentReplayMode)
          : state.replayStates;
        const currentState = filteredStates[state.currentReplayStep];
        return currentState ? currentState.reports : [];
      },

      // Session phase actions implementation
      moveToFollowUp: (initialData: InitialSessionData) => {
        set((state) => {
          const seededReports = (initialData?.reports || []) as Report[];
          return {
            sessionPhase: 'follow-up',
            initialSessionData: initialData,
            // seed cache so getAllReports() is non-empty in follow-up
            reportCache: Array.isArray(state.reportCache)
              ? [...state.reportCache, ...seededReports]
              : [...seededReports]
          };
        });
      },

      saveFollowUpSession: (followUpData: InitialSessionData) => {
        set({
          followUpSessionData: followUpData,
        });
      },

      resetToInitialPhase: () => {
        set({
          sessionPhase: 'initial',
          initialSessionData: null,
          followUpSessionData: null,
        });
      },

      getSessionPhase: () => {
        return (get() as any).sessionPhase || 'initial';
      },

      getInitialSessionData: () => {
        return (get() as any).initialSessionData || null;
      },

      getFollowUpSessionData: () => {
        return (get() as any).followUpSessionData || null;
      },
}));