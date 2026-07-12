import { ForbiddenException } from "@nestjs/common";
import { MedprepMode } from "@prisma/client";
import { MedprepAiService } from "./medprep-ai.service";

describe("MedprepAiService", () => {
  const prismaMock: any = {
    medprepConversation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    medprepConversationMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    medprepSoapNote: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    medprepDiagnosisSubmission: {
      create: jest.fn(),
    },
    medprepHintSession: {
      upsert: jest.fn(),
    },
  };

  const subscriptionsMock: any = {
    /** Legacy-style: access only → all modes allowed */
    getUserEntitlementsMap: jest.fn().mockResolvedValue({
      "medprepai.access": { enabled: true },
    }),
  };

  const achievementsMock: any = {
    recordActivity: jest.fn().mockResolvedValue({ unlocked: [], pointsAwarded: 0 }),
  };

  const studentInstitutionMock: any = {
    syncAssignmentFromMedprepSession: jest.fn().mockResolvedValue(null),
  };

  let service: MedprepAiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MedprepAiService(
      prismaMock,
      subscriptionsMock,
      achievementsMock,
      studentInstitutionMock,
    );
  });

  it("returns existing active session instead of creating duplicate", async () => {
    prismaMock.medprepConversation.findFirst.mockResolvedValueOnce({ id: "existing-session" });

    const result = await service.startSession("user-1", {
      mode: "PRACTICE" as any,
      caseId: "case-1",
    });

    expect(result).toEqual({ id: "existing-session" });
    expect(prismaMock.medprepConversation.create).not.toHaveBeenCalled();
  });

  it("throws when user accesses a different user's session", async () => {
    prismaMock.medprepConversation.findUnique.mockResolvedValueOnce({
      id: "session-1",
      userId: "owner-user",
      messages: [],
      diagnosisSubmissions: [],
      soapNotes: [],
      hintSessions: [],
    });

    await expect(service.getSession("another-user", "session-1")).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it("blocks starting a session when package lists modes but none are selected", async () => {
    subscriptionsMock.getUserEntitlementsMap.mockResolvedValueOnce({
      "medprepai.access": { enabled: true },
      "medprepai.modes": { items: [], limitsPerMode: {}, limitPeriod: "MONTH" },
    });
    prismaMock.medprepConversation.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.startSession("user-1", {
        mode: MedprepMode.PRACTICE,
        caseId: "case-1",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaMock.medprepConversation.create).not.toHaveBeenCalled();
  });

  it("blocks LEARNING when subscription only includes Practice (let-me-drive)", async () => {
    subscriptionsMock.getUserEntitlementsMap.mockResolvedValueOnce({
      "medprepai.access": { enabled: true },
      "medprepai.modes": {
        items: ["let-me-drive"],
        limitsPerMode: { "let-me-drive": 2 },
        limitPeriod: "MONTH",
      },
    });
    prismaMock.medprepConversation.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.startSession("user-1", {
        mode: MedprepMode.LEARNING,
        caseId: "case-1",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("records intervention count when doctor intervention message is added", async () => {
    prismaMock.medprepConversation.findUnique.mockResolvedValueOnce({
      id: "session-1",
      userId: "user-1",
      messages: [],
      diagnosisSubmissions: [],
      soapNotes: [],
      hintSessions: [],
    });
    prismaMock.medprepConversationMessage.create.mockResolvedValueOnce({ id: "msg-1" });

    await service.addMessage("user-1", "session-1", {
      role: "DOCTOR" as any,
      content: "Please explore red flags.",
      isIntervention: true,
    });

    expect(prismaMock.medprepConversation.update).toHaveBeenCalledWith({
      where: { id: "session-1" },
      data: { interventionCount: { increment: 1 } },
    });
  });
});
