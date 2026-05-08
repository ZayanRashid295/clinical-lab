import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MEDPREP_MODES } from "./medprep-modes";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  MedprepConversationStatus,
  MedprepMode,
} from "@prisma/client";
import {
  CreateMedprepMessageDto,
  StartMedprepSessionDto,
  SubmitMedprepDiagnosisDto,
  SubmitMedprepSoapDto,
  UpdateMedprepSessionDto,
  UpsertMedprepHintSessionDto,
  UpsertMedprepSoapDto,
} from "./dto/medprep-ai.dto";

@Injectable()
export class MedprepAiService {
  constructor(private readonly prisma: PrismaService) {}

  getModes() {
    return {
      modes: MEDPREP_MODES.map((m) => ({
        id: m.id,
        title: m.title,
        heroHeadline: m.heroHeadline,
        summary: m.summary,
        highlights: m.highlights,
        ctaLabel: m.ctaLabel,
        standaloneAppPath: m.standaloneAppPath,
      })),
    };
  }

  async startSession(userId: string | undefined, dto: StartMedprepSessionDto) {
    this.ensureUserId(userId);
    const existing = await this.prisma.medprepConversation.findFirst({
      where: {
        userId,
        mode: dto.mode,
        status: "ACTIVE",
        caseId: dto.caseId ?? undefined,
      },
      orderBy: { updatedAt: "desc" },
      include: this.sessionInclude,
    });

    if (existing) return existing;

    return this.prisma.medprepConversation.create({
      data: {
        userId,
        mode: dto.mode,
        caseId: dto.caseId,
        caseInstanceId: dto.caseInstanceId,
        title: dto.title,
        isGeneratedCase: dto.isGeneratedCase ?? false,
        metadata: {
          caseSnapshot: dto.caseSnapshot ?? null,
          extra: dto.metadata ?? null,
        } as any,
      },
      include: this.sessionInclude,
    });
  }

  async listSessions(
    userId: string | undefined,
    params: {
      mode?: MedprepMode;
      status?: MedprepConversationStatus;
      caseId?: string;
    }
  ) {
    this.ensureUserId(userId);
    return this.prisma.medprepConversation.findMany({
      where: {
        userId,
        mode: params.mode,
        status: params.status,
        OR: params.caseId
          ? [{ caseId: params.caseId }, { caseInstanceId: params.caseId }]
          : undefined,
      },
      orderBy: { updatedAt: "desc" },
      include: this.sessionInclude,
      take: 100,
    });
  }

  async getSession(userId: string | undefined, id: string) {
    const session = await this.prisma.medprepConversation.findUnique({
      where: { id },
      include: this.sessionInclude,
    });
    this.assertSessionOwner(session, userId);
    return session;
  }

  async updateSession(userId: string | undefined, id: string, dto: UpdateMedprepSessionDto) {
    const session = await this.getSession(userId, id);
    const statusTimestamps: Record<string, Date | undefined> = {};
    if (dto.status === "COMPLETED") statusTimestamps.completedAt = new Date();
    if (dto.status === "ABANDONED") statusTimestamps.abandonedAt = new Date();
    if (dto.status === "ACTIVE") {
      statusTimestamps.completedAt = undefined;
      statusTimestamps.abandonedAt = undefined;
    }

    return this.prisma.medprepConversation.update({
      where: { id: session.id },
      data: {
        status: dto.status,
        score: dto.score,
        metadata: dto.metadata ? { ...(session.metadata as any), ...dto.metadata } : undefined,
        ...statusTimestamps,
      },
      include: this.sessionInclude,
    });
  }

  async getResumeSession(userId: string | undefined, mode: MedprepMode, caseId?: string) {
    this.ensureUserId(userId);
    return this.prisma.medprepConversation.findFirst({
      where: {
        userId,
        mode,
        status: "ACTIVE",
        OR: caseId ? [{ caseId }, { caseInstanceId: caseId }] : undefined,
      },
      orderBy: { updatedAt: "desc" },
      include: this.sessionInclude,
    });
  }

  async addMessage(userId: string | undefined, sessionId: string, dto: CreateMedprepMessageDto) {
    const session = await this.getSession(userId, sessionId);
    const message = await this.prisma.medprepConversationMessage.create({
      data: {
        conversationId: session.id,
        role: dto.role,
        content: dto.content,
        isIntervention: dto.isIntervention ?? false,
        relevanceScore: dto.relevanceScore,
        metadata: dto.metadata as any,
      },
    });

    if (dto.role === "DOCTOR" && dto.isIntervention) {
      await this.prisma.medprepConversation.update({
        where: { id: session.id },
        data: { interventionCount: { increment: 1 } },
      });
    }
    return message;
  }

  async listMessages(userId: string | undefined, sessionId: string) {
    const session = await this.getSession(userId, sessionId);
    return this.prisma.medprepConversationMessage.findMany({
      where: { conversationId: session.id },
      orderBy: { createdAt: "asc" },
    });
  }

  async upsertSoap(userId: string | undefined, sessionId: string, dto: UpsertMedprepSoapDto) {
    const session = await this.getSession(userId, sessionId);
    const data = {
      subjective: dto.subjective ?? "",
      objective: dto.objective ?? "",
      assessment: dto.assessment ?? "",
      plan: dto.plan ?? "",
      aiSubjective: dto.aiSubjective,
      aiObjective: dto.aiObjective,
      aiAssessment: dto.aiAssessment,
      aiPlan: dto.aiPlan,
      grade: dto.grade,
      feedback: dto.feedback,
      lastSavedAt: new Date(),
    };
    return this.prisma.medprepSoapNote.upsert({
      where: { conversationId_userId: { conversationId: session.id, userId: userId || session.userId } },
      create: {
        conversationId: session.id,
        userId: userId || session.userId,
        ...data,
      },
      update: data,
    });
  }

  async submitSoap(userId: string | undefined, sessionId: string, dto: SubmitMedprepSoapDto) {
    await this.getSession(userId, sessionId);
    const soap = await this.upsertSoap(userId, sessionId, dto);
    return this.prisma.medprepSoapNote.update({
      where: { id: soap.id },
      data: { submittedAt: new Date(), lastSavedAt: new Date() },
    });
  }

  async submitDiagnosis(userId: string | undefined, sessionId: string, dto: SubmitMedprepDiagnosisDto) {
    const session = await this.getSession(userId, sessionId);
    return this.prisma.medprepDiagnosisSubmission.create({
      data: {
        conversationId: session.id,
        userId: userId || session.userId,
        caseId: dto.caseId ?? session.caseId,
        submittedDiagnosis: dto.submittedDiagnosis,
        actualDiagnosis: dto.actualDiagnosis,
        isCorrect: dto.isCorrect,
        isRareCase: dto.isRareCase ?? false,
        specialty: dto.specialty,
        caseDifficulty: dto.caseDifficulty,
      },
    });
  }

  async upsertHintSession(
    userId: string | undefined,
    sessionId: string,
    dto: UpsertMedprepHintSessionDto
  ) {
    const session = await this.getSession(userId, sessionId);
    return this.prisma.medprepHintSession.upsert({
      where: { sessionKey: dto.sessionKey },
      create: {
        sessionKey: dto.sessionKey,
        userId: userId || session.userId,
        conversationId: session.id,
        caseId: dto.caseId ?? session.caseId,
        totalHintsUsed: dto.totalHintsUsed ?? 0,
        highImportanceHints: dto.highImportanceHints ?? 0,
        mediumImportanceHints: dto.mediumImportanceHints ?? 0,
        lowImportanceHints: dto.lowImportanceHints ?? 0,
        gradePenalty: dto.gradePenalty ?? 0,
        hintTimestamps: dto.hintTimestamps as any,
        hintsByCategory: dto.hintsByCategory as any,
      },
      update: {
        totalHintsUsed: dto.totalHintsUsed,
        highImportanceHints: dto.highImportanceHints,
        mediumImportanceHints: dto.mediumImportanceHints,
        lowImportanceHints: dto.lowImportanceHints,
        gradePenalty: dto.gradePenalty,
        hintTimestamps: dto.hintTimestamps as any,
        hintsByCategory: dto.hintsByCategory as any,
      },
    });
  }

  async scoreSession(
    userId: string | undefined,
    sessionId: string,
    score: number,
    feedback?: string
  ) {
    const session = await this.getSession(userId, sessionId);
    await this.prisma.medprepConversation.update({
      where: { id: sessionId },
      data: { score },
    });
    const soap = await this.prisma.medprepSoapNote.findUnique({
      where: {
        conversationId_userId: {
          conversationId: sessionId,
          userId: userId || session.userId,
        },
      },
    });
    if (!soap) return { score };
    const updatedSoap = await this.prisma.medprepSoapNote.update({
      where: { id: soap.id },
      data: { grade: score, feedback: feedback ?? soap.feedback },
    });
    return { score, soap: updatedSoap };
  }

  private assertSessionOwner<T extends { userId: string }>(
    session: T | null,
    userId?: string
  ): asserts session is T {
    if (!session) throw new NotFoundException("Session not found");
    if (!userId) return;
    if (session.userId !== userId) throw new ForbiddenException("Not yours");
  }

  private readonly sessionInclude = {
    messages: { orderBy: { createdAt: "asc" as const } },
    diagnosisSubmissions: { orderBy: { submittedAt: "desc" as const }, take: 20 },
    soapNotes: { orderBy: { updatedAt: "desc" as const }, take: 1 },
    hintSessions: { orderBy: { updatedAt: "desc" as const }, take: 1 },
  };

  private ensureUserId(userId?: string) {
    if (!userId) {
      throw new BadRequestException("userId is required");
    }
  }
}
