import { ForbiddenException } from "@nestjs/common";
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

  let service: MedprepAiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MedprepAiService(prismaMock);
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
