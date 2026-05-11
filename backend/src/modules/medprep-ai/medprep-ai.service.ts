import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MEDPREP_MODES } from "./medprep-modes";
import { MedprepConversationStatus, MedprepMode } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { AchievementsService } from "../achievements/achievements.service";
import {
  MEDPREP_ENTITLEMENT_SLUGS,
  MEDPREP_SLUG_TO_MODE,
  modeToSlug,
} from "./medprep-mode-map";
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly achievements: AchievementsService
  ) {}

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

    if (existing) {
      await this.assertMedprepModeAllowed(userId!, existing.mode);
      return existing;
    }

    await this.assertMedprepModeAllowed(userId!, dto.mode);
    await this.enforceDistinctCaseQuota(userId!, dto.mode);

    const created = await this.prisma.medprepConversation.create({
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
    void this.achievements
      .recordActivity(userId!, "MEDPREP_CONVERSATIONS", 1)
      .catch(() => undefined);
    return created;
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
    const allowedEnumModes = await this.listSubscriptionAllowedModes(userId!);
    if (allowedEnumModes !== null && allowedEnumModes.length === 0) {
      return [];
    }

    let modeFilter: MedprepMode | { in: MedprepMode[] } | undefined;
    if (params.mode) {
      if (allowedEnumModes !== null && !allowedEnumModes.includes(params.mode)) {
        return [];
      }
      modeFilter = params.mode;
    } else if (allowedEnumModes !== null) {
      modeFilter = { in: allowedEnumModes };
    }

    return this.prisma.medprepConversation.findMany({
      where: {
        userId,
        mode: modeFilter,
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
    await this.assertMedprepModeAllowed(userId!, session.mode);
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
    await this.assertMedprepModeAllowed(userId!, mode);
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

  /**
   * Distinct cases started in the window: unique caseId per row; missing caseId counts as `sess:<id>`.
   */
  async countDistinctCasesSince(userId: string, mode: MedprepMode, since: Date): Promise<number> {
    const rows = await this.prisma.medprepConversation.findMany({
      where: { userId, mode, createdAt: { gte: since } },
      select: { caseId: true, id: true },
    });
    const keys = new Set(
      rows.map((r) => (r.caseId && String(r.caseId).length > 0 ? r.caseId : `sess:${r.id}`)),
    );
    return keys.size;
  }

  private windowStartForPeriod(period: "DAY" | "MONTH"): Date {
    const now = new Date();
    if (period === "DAY") {
      return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
      );
    }
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  }

  /**
   * When `medprepai.modes` is absent → legacy behavior: any mode allowed if `medprepai.access` is on.
   * When present (non-null object) → strict allow-list from `items` (route slugs). Empty list = no modes.
   */
  private resolveMedprepModesPolicy(entitlements: Record<string, any>): {
    restrictModes: boolean;
    allowedSlugs: Set<string>;
    modesPack: Record<string, any> | undefined;
  } {
    const raw = entitlements["medprepai.modes"];
    if (raw === undefined || raw === null) {
      return { restrictModes: false, allowedSlugs: new Set(), modesPack: undefined };
    }
    if (typeof raw !== "object" || Array.isArray(raw)) {
      return { restrictModes: false, allowedSlugs: new Set(), modesPack: undefined };
    }
    const itemsRaw = (raw as any).items;
    const items = Array.isArray(itemsRaw)
      ? itemsRaw.filter((x): x is string => typeof x === "string")
      : [];
    const allowedSlugs = new Set(items.filter((slug) => MEDPREP_ENTITLEMENT_SLUGS.has(slug)));
    return {
      restrictModes: true,
      allowedSlugs,
      modesPack: raw as Record<string, any>,
    };
  }

  private medprepAccessEnabled(entitlements: Record<string, any>): boolean {
    const access = entitlements["medprepai.access"] as any;
    return (
      access === true ||
      (access &&
        typeof access === "object" &&
        (access.enabled === undefined || access.enabled === true))
    );
  }

  /** null = no subscription-side filter (legacy); empty = none allowed */
  private async listSubscriptionAllowedModes(userId: string): Promise<MedprepMode[] | null> {
    const entitlements = await this.subscriptionsService.getUserEntitlements(userId);
    const policy = this.resolveMedprepModesPolicy(entitlements);
    if (!policy.restrictModes) return null;
    const modes: MedprepMode[] = [];
    for (const slug of policy.allowedSlugs) {
      const m = MEDPREP_SLUG_TO_MODE[slug];
      if (m) modes.push(m);
    }
    return modes;
  }

  private async assertMedprepModeAllowed(userId: string, mode: MedprepMode) {
    const entitlements = await this.subscriptionsService.getUserEntitlements(userId);
    if (!this.medprepAccessEnabled(entitlements)) {
      throw new ForbiddenException(
        "MedPrepAI is not included in your subscription. Upgrade to unlock case practice.",
      );
    }
    const policy = this.resolveMedprepModesPolicy(entitlements);
    if (!policy.restrictModes) return;
    const slug = modeToSlug(mode);
    if (policy.allowedSlugs.size === 0) {
      throw new ForbiddenException(
        "No MedPrep modes are enabled on your current subscription package.",
      );
    }
    if (!policy.allowedSlugs.has(slug)) {
      throw new ForbiddenException(
        "This learning mode is not included in your current subscription package.",
      );
    }
  }

  /** Per-mode distinct-case quota (optional caps in `limitsPerMode`). */
  private async enforceDistinctCaseQuota(userId: string, mode: MedprepMode) {
    const entitlements = await this.subscriptionsService.getUserEntitlements(userId);
    const modesPack = entitlements["medprepai.modes"] as Record<string, any> | undefined;
    if (!modesPack || typeof modesPack !== "object") {
      return;
    }

    const slug = modeToSlug(mode);
    const limitsMap = modesPack.limitsPerMode as Record<string, unknown> | undefined;
    const rawCap = limitsMap?.[slug];
    if (rawCap === null || rawCap === undefined) {
      return;
    }
    const cap = Number(rawCap);
    if (!Number.isFinite(cap)) {
      return;
    }
    if (cap <= 0) {
      throw new ForbiddenException("No case quota for this mode on your plan.");
    }

    const periodRaw = String(modesPack.limitPeriod || "MONTH").toUpperCase();
    const period: "DAY" | "MONTH" = periodRaw === "DAY" ? "DAY" : "MONTH";
    const since = this.windowStartForPeriod(period);
    const used = await this.countDistinctCasesSince(userId, mode, since);
    if (used >= cap) {
      throw new ForbiddenException(
        `Case limit reached for this mode (${cap} distinct cases per ${period === "DAY" ? "day" : "month"}).`,
      );
    }
  }

  /** Student dashboard: limits + usage per MedPrep mode (slug = frontend route id). */
  async getMyCaseLimitSummary(userId: string | undefined) {
    this.ensureUserId(userId);
    const entitlements = await this.subscriptionsService.getUserEntitlements(userId!);
    const hasAccess = this.medprepAccessEnabled(entitlements);
    const policy = this.resolveMedprepModesPolicy(entitlements);

    const modesPack = entitlements["medprepai.modes"] as Record<string, any> | undefined;
    const limitsMap = (modesPack?.limitsPerMode ?? {}) as Record<string, unknown>;
    const periodRaw = String(modesPack?.limitPeriod || "MONTH").toUpperCase();
    const period: "DAY" | "MONTH" = periodRaw === "DAY" ? "DAY" : "MONTH";
    const since = this.windowStartForPeriod(period);

    const rows = await Promise.all(
      MEDPREP_MODES.map(async (m) => {
        const slug = m.id;
        const modeEnum = MEDPREP_SLUG_TO_MODE[slug];
        if (!modeEnum) {
          return {
            slug,
            mode: null,
            title: m.title,
            enabled: false,
            limit: null as number | null,
            limitPeriod: period,
            used: 0,
          };
        }

        const onPlan =
          !policy.restrictModes || (policy.allowedSlugs.size > 0 && policy.allowedSlugs.has(slug));
        const rawLim = limitsMap[slug];
        let limit: number | null = null;
        if (rawLim !== undefined && rawLim !== null) {
          const n = Number(rawLim);
          limit = Number.isFinite(n) ? n : null;
        }

        let used = 0;
        if (hasAccess && onPlan) {
          used = await this.countDistinctCasesSince(userId!, modeEnum, since);
        }

        return {
          slug,
          mode: modeEnum,
          title: m.title,
          enabled: hasAccess && onPlan,
          limit,
          limitPeriod: period,
          used,
        };
      }),
    );

    return {
      hasMedprepAccess: Boolean(hasAccess),
      limitPeriod: period,
      modes: rows,
    };
  }
}
