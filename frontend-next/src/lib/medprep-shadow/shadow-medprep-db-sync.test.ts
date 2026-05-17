import { describe, expect, it } from "@jest/globals"
import {
  applyFollowUpConversationResume,
  hydrateShadowSessionFromMedprepMetadata,
  parseShadowSupervisorInterventionsFromMetadata,
} from "./shadow-medprep-db-sync"
import type { LearningSession } from "./learning-types"

describe("hydrateShadowSessionFromMedprepMetadata", () => {
  it("restores supervisor interventions even when shadowTurnsByDoctorIndex exists", () => {
    const session: LearningSession = {
      id: "s1",
      caseId: "c1",
      disease: "Chest pain",
      patientProfile: {},
      conversation: [],
      isComplete: false,
      createdAt: new Date().toISOString(),
    }

    const metadata = {
      shadowTurnsByDoctorIndex: {
        "0": { doctorThought: "Consider ACS.", differentialDiagnosis: [] },
      },
      shadowSupervisorInterventions: [
        {
          id: "intervention-1",
          timestamp: "2026-05-15T13:50:35.000Z",
          role: "student",
          question: "wanna have sex with me?",
          messageId: "student-1",
          reason: "Unprofessional question.",
          content: "Rephrase to be medically appropriate.",
        },
      ],
    }

    hydrateShadowSessionFromMedprepMetadata(session, [], metadata)

    expect(session.doctorThoughts?.length).toBe(1)
    expect(session.supervisorInterventions?.length).toBe(1)
    expect(session.supervisorInterventions?.[0].question).toContain("sex")
  })

  it("restores diagnosisReady from shadowProgress metadata", () => {
    const session: LearningSession = {
      id: "s1",
      caseId: "c1",
      disease: "Chest pain",
      patientProfile: {},
      conversation: [],
      isComplete: false,
      createdAt: new Date().toISOString(),
    }

    hydrateShadowSessionFromMedprepMetadata(session, [], {
      shadowProgress: {
        diagnosisReady: true,
        conversationLength: 4,
        isComplete: false,
      },
    })

    expect(session.diagnosisReady).toBe(true)
  })

  it("maps legacy shadowProgress.isComplete to diagnosisReady when session not completed", () => {
    const session: LearningSession = {
      id: "s1",
      caseId: "c1",
      disease: "Chest pain",
      patientProfile: {},
      conversation: [],
      isComplete: false,
      createdAt: new Date().toISOString(),
    }

    hydrateShadowSessionFromMedprepMetadata(session, [], {
      shadowProgress: {
        isComplete: true,
        conversationLength: 6,
      },
    })

    expect(session.diagnosisReady).toBe(true)
    expect(session.isComplete).toBe(false)
  })

  it("splits transcript for follow-up resume and clears stale diagnosisReady", () => {
    const session: LearningSession = {
      id: "s1",
      caseId: "c1",
      disease: "Chest pain",
      patientProfile: {},
      conversation: [],
      isComplete: false,
      diagnosisReady: true,
      createdAt: new Date().toISOString(),
    }
    const all = [
      { id: "1", role: "doctor" as const, content: "Initial Q", timestamp: "t1" },
      { id: "2", role: "patient" as const, content: "Initial A", timestamp: "t2" },
      { id: "3", role: "doctor" as const, content: "Follow-up hi", timestamp: "t3" },
    ]
    const meta = {
      shadowProgress: {
        sessionPhase: "follow-up",
        initialMessageCount: 2,
        diagnosisReady: false,
        initialSessionSnapshot: {
          conversation: all.slice(0, 2),
          soapNote: "SOAP",
          prescription: "Rx",
        },
      },
    }
    applyFollowUpConversationResume(session, all, meta)
    expect(session.conversation).toHaveLength(1)
    expect(session.conversation[0].content).toBe("Follow-up hi")
    expect(session.shadowPhase).toBe("follow-up")
    expect(session.diagnosisReady).toBe(false)
    expect(session.shadowSoapNote).toBe("SOAP")
  })

  it("splits follow-up transcript at follow-up-greeting id when initialMessageCount missing", () => {
    const session: LearningSession = {
      id: "s1",
      caseId: "c1",
      disease: "Chest pain",
      patientProfile: {},
      conversation: [],
      isComplete: false,
      createdAt: new Date().toISOString(),
    }
    const all = [
      { id: "1", role: "doctor" as const, content: "Initial Q", timestamp: "t1" },
      { id: "2", role: "patient" as const, content: "Initial A", timestamp: "t2" },
      {
        id: "follow-up-greeting-1",
        role: "doctor" as const,
        content: "Welcome back",
        timestamp: "t3",
      },
      { id: "4", role: "patient" as const, content: "Thanks", timestamp: "t4" },
    ]
    const meta = {
      shadowProgress: {
        sessionPhase: "follow-up",
        initialSessionSnapshot: {
          conversation: all.slice(0, 2),
          soapNote: "SOAP",
        },
      },
    }
    applyFollowUpConversationResume(session, all, meta)
    expect(session.conversation).toHaveLength(2)
    expect(session.conversation[0].content).toBe("Welcome back")
  })

  it("parseShadowSupervisorInterventionsFromMetadata reads top-level array", () => {
    const list = parseShadowSupervisorInterventionsFromMetadata({
      shadowSupervisorInterventions: [
        {
          id: "i1",
          timestamp: "2026-05-15T13:50:35.000Z",
          role: "student",
          question: "q",
          reason: "r",
          content: "c",
        },
      ],
    })
    expect(list).toHaveLength(1)
  })
})
