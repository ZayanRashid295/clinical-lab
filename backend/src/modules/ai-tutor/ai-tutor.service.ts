import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma/prisma.service";
import OpenAI from "openai";
import {
  CreateConversationDto,
  SendMessageDto,
  UpdateConversationDto,
} from "./dto/ai-tutor.dto";

const SYSTEM_PROMPT = `You are an experienced medical tutor assistant for clinical-lab students.
Guidelines:
- Be concise but explain mechanisms when asked.
- For clinical scenarios, walk through differentials and key discriminating features.
- Cite "first-line" management when relevant.
- If a question is ambiguous, ask one clarifying question first.
- Never claim to give actual medical advice for real patients.`;

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger(AiTutorService.name);
  private client: OpenAI | null = null;
  private model: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    this.model = this.config.get<string>("OPENAI_MODEL") || "gpt-4o-mini";
    if (apiKey && !apiKey.startsWith("your-")) {
      try {
        this.client = new OpenAI({ apiKey });
      } catch (e) {
        this.logger.warn(`Could not init OpenAI client: ${(e as Error).message}`);
      }
    } else {
      this.logger.warn(
        "OPENAI_API_KEY missing — AI Tutor will respond with offline fallback messages"
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

    const userMessage = await this.prisma.aiTutorMessage.create({
      data: {
        conversationId,
        role: "USER",
        content: dto.content,
      },
    });

    // First-message titling: take first 60 chars of the user prompt
    if (conv.messages.length === 0 && conv.title === "New conversation") {
      await this.prisma.aiTutorConversation.update({
        where: { id: conversationId },
        data: { title: dto.content.slice(0, 60) },
      });
    }

    const history = [...conv.messages, userMessage];

    let assistantContent: string;
    let model: string | undefined;
    let tokensIn: number | undefined;
    let tokensOut: number | undefined;

    if (!this.client) {
      assistantContent = this.offlineFallback(dto.content);
    } else {
      try {
        const completion = await this.client.chat.completions.create({
          model: this.model,
          temperature: 0.4,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map((m) => ({
              role: m.role.toLowerCase() as "user" | "assistant" | "system",
              content: m.content,
            })),
          ],
        });
        assistantContent =
          completion.choices?.[0]?.message?.content?.trim() ||
          "I'm sorry — I couldn't generate a response. Try rephrasing your question.";
        model = completion.model;
        tokensIn = completion.usage?.prompt_tokens;
        tokensOut = completion.usage?.completion_tokens;
      } catch (e) {
        this.logger.error(`OpenAI call failed: ${(e as Error).message}`);
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
      `5. **Take-home pearl.** Write a 1-line note for your flashcards.`,
      ``,
      `Add an OpenAI API key in the backend \`.env\` (\`OPENAI_API_KEY\`) and restart to enable full tutor responses.`,
    ].join("\n");
  }
}
