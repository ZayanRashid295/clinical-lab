import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma/prisma.service";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BillingSubscriptionsService } from "../billing/subscriptions/billing-subscriptions.service";
import { AchievementsService } from "../achievements/achievements.service";
import { AiTutorRole } from "@prisma/client";
import {
  CreateConversationDto,
  SendMessageDto,
  UpdateConversationDto,
} from "./dto/ai-tutor.dto";

const SYSTEM_PROMPT = `You are an experienced medical tutor assistant for MedPrepAI students.
Guidelines:
- Be concise but explain mechanisms when asked.
- For clinical scenarios, walk through differentials and key discriminating features.
- Cite "first-line" management when relevant.
- If a question is ambiguous, ask one clarifying question first.
- Never claim to give actual medical advice for real patients.`;

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger(AiTutorService.name);
  private genAI: GoogleGenerativeAI | null = null;
  /** Gemini model id (e.g. gemini-2.5-flash). */
  private modelId: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private billingService: BillingSubscriptionsService,
    private achievements: AchievementsService
  ) {
    const apiKey =
      this.config.get<string>("GOOGLE_API_KEY") ||
      this.config.get<string>("GEMINI_API_KEY");
    this.modelId =
      this.config.get<string>("GEMINI_MODEL") || "gemini-2.5-flash";
    if (apiKey && !apiKey.startsWith("your-")) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
      } catch (e) {
        this.logger.warn(
          `Could not init Google Generative AI client: ${(e as Error).message}`
        );
      }
    } else {
      this.logger.warn(
        "GOOGLE_API_KEY missing — AI Tutor will respond with offline fallback messages"
      );
    }
  }

  // ---------- conversations ----------
  async createConversation(userId: string, dto: CreateConversationDto) {
    return this.prisma.aiTutorConversation.create({
      data: {
        userId,
        title: dto.title?.trim() || "New conversation",
        context: dto.context as any,
        contextId: dto.contextId,
      },
    });
  }

  async listConversations(userId: string) {
    return this.prisma.aiTutorConversation.findMany({
      where: { userId, archivedAt: null },
      orderBy: [{ pinned: "desc" }, { lastMessageAt: "desc" }],
      take: 50,
    });
  }

  async getConversation(userId: string, id: string) {
    const conv = await this.prisma.aiTutorConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conv) throw new NotFoundException("Conversation not found");
    if (conv.userId !== userId) throw new ForbiddenException("Not yours");
    return conv;
  }

  async updateConversation(
    userId: string,
    id: string,
    dto: UpdateConversationDto
  ) {
    const conv = await this.prisma.aiTutorConversation.findUnique({
      where: { id },
    });
    if (!conv) throw new NotFoundException("Conversation not found");
    if (conv.userId !== userId) throw new ForbiddenException("Not yours");

    return this.prisma.aiTutorConversation.update({
      where: { id },
      data: {
        title: dto.title,
        context: dto.context as any,
        contextId: dto.contextId,
        pinned: dto.pinned,
        archivedAt: dto.archive ? new Date() : undefined,
      },
    });
  }

  async deleteConversation(userId: string, id: string) {
    const conv = await this.prisma.aiTutorConversation.findUnique({
      where: { id },
    });
    if (!conv) throw new NotFoundException("Conversation not found");
    if (conv.userId !== userId) throw new ForbiddenException("Not yours");
    await this.prisma.aiTutorConversation.delete({ where: { id } });
    return { message: "Conversation deleted" };
  }

  // ---------- messages ----------
  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    const conv = await this.prisma.aiTutorConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conv) throw new NotFoundException("Conversation not found");
    if (conv.userId !== userId) throw new ForbiddenException("Not yours");

    await this.enforceAndConsumeChatQuota(userId);

    const userMessage = await this.prisma.aiTutorMessage.create({
      data: {
        conversationId,
        role: "USER",
        content: dto.content,
      },
    });

    void this.achievements
      .recordActivity(userId, "AI_TUTOR_MESSAGES", 1)
      .catch(() => undefined);

    // First-message titling: take first 60 chars of the user prompt
    if (conv.messages.length === 0 && conv.title === "New conversation") {
      await this.prisma.aiTutorConversation.update({
        where: { id: conversationId },
        data: { title: dto.content.slice(0, 60) },
      });
    }

    let assistantContent: string;
    let model: string | undefined;
    let tokensIn: number | undefined;
    let tokensOut: number | undefined;

    if (!this.genAI) {
      assistantContent = this.offlineFallback(dto.content);
    } else {
      try {
        const generativeModel = this.genAI.getGenerativeModel({
          model: this.modelId,
          systemInstruction: SYSTEM_PROMPT,
        });
        const priorHistory = this.buildGeminiHistory(conv.messages);
        const chat = generativeModel.startChat({
          history: priorHistory,
          generationConfig: { temperature: 0.4 },
        });
        const result = await chat.sendMessage(userMessage.content);
        const response = result.response;
        assistantContent =
          response.text()?.trim() ||
          "I'm sorry — I couldn't generate a response. Try rephrasing your question.";
        model = this.modelId;
        tokensIn = response.usageMetadata?.promptTokenCount;
        tokensOut = response.usageMetadata?.candidatesTokenCount;
      } catch (e) {
        this.logger.error(`Gemini call failed: ${(e as Error).message}`);
        assistantContent = this.offlineFallback(dto.content);
      }
    }

    const assistantMessage = await this.prisma.aiTutorMessage.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: assistantContent,
        model,
        tokensIn,
        tokensOut,
      },
    });

    await this.prisma.aiTutorConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return { userMessage, assistantMessage };
  }

  /** Parse integer env with safe fallback (Nest Config env vars are often strings). */
  private getConfigInt(key: string, fallback: number): number {
    const raw = this.config.get<string | number | undefined>(key);
    if (raw === undefined || raw === null || raw === "") return fallback;
    const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * Resolves chat quota from merged subscription entitlements + platform defaults.
   * - If `aitutor.chat` is missing → use env default (AI_TUTOR_CHAT_LIMIT_WITHOUT_ENTITLEMENT, default 5).
   * - If `enabled: false` → quota 0 (explicitly disabled on package).
   * - If present with numeric `limit` → admin/package quota (+ period).
   * - If present but no numeric limit → AI_TUTOR_CHAT_FALLBACK_LIMIT (default 20) so misconfigured packages still behave predictably.
   */
  private resolveAiTutorChatQuota(entitlements: Record<string, unknown>): {
    limit: number;
    period: "DAY" | "MONTH";
    source: "admin" | "platform_default_no_entitlement" | "platform_fallback_entitled";
  } {
    const limitWithoutEntitlement = this.getConfigInt(
      "AI_TUTOR_CHAT_LIMIT_WITHOUT_ENTITLEMENT",
      5
    );
    const fallbackWhenEntitledNoNumericLimit = this.getConfigInt(
      "AI_TUTOR_CHAT_FALLBACK_LIMIT",
      20
    );
    const periodWhenWithoutEntitlementRaw =
      this.config.get<string>("AI_TUTOR_CHAT_PERIOD_WITHOUT_ENTITLEMENT") || "DAY";
    const periodWhenWithoutEntitlement: "DAY" | "MONTH" =
      String(periodWhenWithoutEntitlementRaw).toUpperCase() === "MONTH"
        ? "MONTH"
        : "DAY";

    const raw = entitlements["aitutor.chat"];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return {
        limit: limitWithoutEntitlement,
        period: periodWhenWithoutEntitlement,
        source: "platform_default_no_entitlement",
      };
    }

    const payload = raw as Record<string, unknown>;
    if (payload.enabled === false) {
      return {
        limit: 0,
        period: "DAY",
        source: "platform_default_no_entitlement",
      };
    }

    const adminLimit =
      typeof payload.limit === "number" && Number.isFinite(payload.limit)
        ? payload.limit
        : null;
    const adminPeriod =
      typeof payload.period === "string" &&
      String(payload.period).toUpperCase() === "MONTH"
        ? "MONTH"
        : "DAY";

    if (adminLimit !== null) {
      return {
        limit: adminLimit,
        period: adminPeriod,
        source: "admin",
      };
    }

    // Package grants AI Tutor (enabled) but no numeric limit merged — use fallback ceiling.
    return {
      limit: fallbackWhenEntitledNoNumericLimit,
      period: adminPeriod,
      source: "platform_fallback_entitled",
    };
  }

  private async enforceAndConsumeChatQuota(userId: string) {
    const features = await this.billingService.getUserFeatures(userId);
    if (!features.includes("aitutor.chat")) {
      throw new ForbiddenException(
        "AI Tutor is not included in your current plan. Upgrade to continue."
      );
    }

    const sub = await this.billingService.getCurrentSubscription(userId);
    const planFeatures = sub?.plan?.featuresJson;
    let limit = this.config.get<number>("AI_TUTOR_CHAT_FALLBACK_LIMIT", 20);
    if (Array.isArray(planFeatures)) {
      const chatFeature = planFeatures.find(
        (f: any) => f?.key === "aitutor.chat" && typeof f?.limit === "number"
      ) as { limit?: number } | undefined;
      if (chatFeature?.limit != null) limit = chatFeature.limit;
    }

    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

    if (limit <= 0) {
      throw new ForbiddenException("AI Tutor chat quota is not available on your plan.");
    }

    await this.prisma.$transaction(async (tx) => {
      const usage = await tx.billingFeatureUsage.findUnique({
        where: {
          userId_featureKey_periodStart_periodEnd: {
            userId,
            featureKey: "aitutor.chat",
            periodStart,
            periodEnd,
          },
        },
      });

      const used = usage?.usedCount ?? 0;
      if (used >= limit) {
        throw new ForbiddenException(
          `AI Tutor chat limit reached (${used}/${limit} today). Upgrade your plan or wait until your quota resets.`
        );
      }

      if (!usage) {
        await tx.billingFeatureUsage.create({
          data: { userId, featureKey: "aitutor.chat", periodStart, periodEnd, usedCount: 1 },
        });
      } else {
        await tx.billingFeatureUsage.update({
          where: { id: usage.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    });
  }

  private buildGeminiHistory(
    messages: Array<{ role: AiTutorRole; content: string }>
  ): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
    const out: Array<{
      role: "user" | "model";
      parts: Array<{ text: string }>;
    }> = [];
    for (const m of messages) {
      if (m.role === "USER") {
        out.push({ role: "user", parts: [{ text: m.content }] });
      } else if (m.role === "ASSISTANT") {
        out.push({ role: "model", parts: [{ text: m.content }] });
      } else {
        out.push({
          role: "user",
          parts: [{ text: `[Context]\n${m.content}` }],
        });
      }
    }
    return out;
  }

  private offlineFallback(prompt: string): string {
    const trimmed = prompt.length > 80 ? prompt.slice(0, 80) + "…" : prompt;
    return [
      `**Offline tutor mode** — the AI service isn't configured right now, so here's a structured starter for you:`,
      ``,
      `**Question:** ${trimmed}`,
      ``,
      `Try this study framework:`,
      `1. **Identify the core concept.** What system or topic is being tested?`,
      `2. **List the differentials.** What else could explain the findings?`,
      `3. **Find the discriminating feature.** What in the stem points to one answer?`,
      `4. **Mechanism check.** Can you explain the underlying physiology in one sentence?`,
      `5. **Take-home pearl.** Write a 1-line note for your study notes.`,
      ``,
      `Add a Google AI API key in the backend \`.env\` (\`GOOGLE_API_KEY\`, same as Gemini elsewhere) and restart to enable full tutor responses.`,
    ].join("\n");
  }
}
