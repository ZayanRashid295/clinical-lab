import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash } from "node:crypto";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateMarketingDemoLeadDto,
  MARKETING_DEMO_PACKS,
  MARKETING_DEMO_SAMPLE_PATHS,
  type MarketingDemoPack,
} from "./dto/create-marketing-demo-lead.dto";

const TOKEN_TYP = "marketing-demo";

type RateBucket = { count: number; resetAt: number };

@Injectable()
export class MarketingDemoService {
  private readonly leadRate = new Map<string, RateBucket>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashIp(ip?: string): string | undefined {
    if (!ip) return undefined;
    return createHash("sha256").update(ip).digest("hex").slice(0, 32);
  }

  private assertLeadRateLimit(key: string) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const max = 8;
    const bucket = this.leadRate.get(key);
    if (!bucket || bucket.resetAt < now) {
      this.leadRate.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    bucket.count += 1;
    if (bucket.count > max) {
      throw new HttpException(
        "Too many demo requests. Please try again later.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async createLead(
    dto: CreateMarketingDemoLeadDto,
    meta: { ip?: string; userAgent?: string },
  ) {
    if (!MARKETING_DEMO_PACKS.includes(dto.pack)) {
      throw new BadRequestException("Unknown demo pack");
    }

    const email = dto.email.trim().toLowerCase();
    const rateKey = `${this.hashIp(meta.ip) || "unknown"}:${email}`;
    this.assertLeadRateLimit(rateKey);

    const lead = await this.prisma.marketingDemoLead.create({
      data: {
        email,
        firstName: dto.firstName.trim().slice(0, 120),
        lastName: dto.lastName.trim().slice(0, 120),
        graduatingYear: dto.graduatingYear?.trim().slice(0, 40) || null,
        country: dto.country?.trim().slice(0, 120) || null,
        pack: dto.pack,
        ipHash: this.hashIp(meta.ip) || null,
        userAgent: meta.userAgent?.slice(0, 512) || null,
      },
    });

    const expiresIn = this.config.get<string>("MARKETING_DEMO_TOKEN_TTL") || "12h";
    const accessToken = this.jwt.sign(
      {
        sub: lead.id,
        pack: dto.pack,
        typ: TOKEN_TYP,
        email,
      },
      { expiresIn },
    );

    return {
      accessToken,
      pack: dto.pack,
      expiresIn,
      samplePath: MARKETING_DEMO_SAMPLE_PATHS[dto.pack],
    };
  }

  verifyDemoToken(token: string, expectedPack?: MarketingDemoPack) {
    try {
      const payload = this.jwt.verify<{
        sub: string;
        pack: MarketingDemoPack;
        typ: string;
      }>(token);
      if (payload.typ !== TOKEN_TYP) {
        throw new UnauthorizedException("Invalid demo token");
      }
      if (expectedPack && payload.pack !== expectedPack) {
        throw new UnauthorizedException("Demo token pack mismatch");
      }
      if (!MARKETING_DEMO_PACKS.includes(payload.pack)) {
        throw new UnauthorizedException("Unknown demo pack");
      }
      return payload;
    } catch {
      throw new UnauthorizedException("Demo session expired or invalid");
    }
  }

  /**
   * Returns only admin-marked demo questions for a landing pack.
   * Shape matches what UnifiedQuestionPreview / QuestionCreatorData expects.
   */
  async getDemoPack(pack: MarketingDemoPack) {
    if (!MARKETING_DEMO_PACKS.includes(pack)) {
      throw new BadRequestException("Unknown demo pack");
    }

    const questions = await this.prisma.question.findMany({
      where: {
        isDemo: true,
        isActive: true,
        demoPack: pack,
      },
      include: {
        choices: { orderBy: { order: "asc" } },
        questionStemBlocks: { orderBy: { order: "asc" } },
        explanationBlocks: { orderBy: { order: "asc" } },
        perAnswerExplanations: {
          include: { blocks: { orderBy: { order: "asc" } } },
        },
        system: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    if (!questions.length) {
      throw new BadRequestException(
        "No demo questions are published for this pack yet.",
      );
    }

    const labels = ["A", "B", "C", "D", "E"];
    const extractHumanQuestionId = (tags: unknown): string | null => {
      if (!Array.isArray(tags)) return null;
      for (const tag of tags) {
        if (typeof tag === "string" && tag.startsWith("__questionId:")) {
          const id = tag.slice("__questionId:".length).trim();
          if (id) return id;
        }
      }
      return null;
    };

    return {
      pack,
      product: "Medicine and Allied",
      category: pack.startsWith("jcat") ? "JCAT (MDMS)" : "FCPS-1",
      questionCount: questions.length,
      questions: questions.map((q, index) => {
        const options = q.choices.map((c, i) => {
          const label = labels[c.order] ?? labels[i] ?? String(i + 1);
          return {
            label,
            value: label,
            text: c.text,
            correct: c.isCorrect,
          };
        });

        // Convert PAE array → Record<label, blocks[]> for preview UI
        const perAnswer: Record<string, unknown[]> = {};
        for (const pae of q.perAnswerExplanations) {
          perAnswer[pae.choiceLabel] = pae.blocks.map((b) => ({
            id: b.id,
            type: String(b.type).toLowerCase() === "images" ? "image" : String(b.type).toLowerCase(),
            order: b.order,
            data: b.data,
          }));
        }

        const mapBlocks = (
          blocks: Array<{ id: string; type: string; order: number; data: unknown }>,
        ) =>
          blocks.map((b) => ({
            id: b.id,
            type:
              String(b.type).toLowerCase() === "images"
                ? "image"
                : String(b.type).toLowerCase(),
            order: b.order,
            data: b.data,
          }));

        return {
          order: index + 1,
          id: q.id,
          questionId: extractHumanQuestionId(q.tags) || q.id,
          displayQuestionId: extractHumanQuestionId(q.tags),
          title: q.title,
          mcqTitle: q.title,
          systemId: q.systemId,
          topicId: q.topicId,
          system: q.system?.name || "",
          topic: q.topic?.name || "",
          subject: "",
          questionStemBlocks: mapBlocks(q.questionStemBlocks),
          options,
          explanation: mapBlocks(q.explanationBlocks),
          perAnswerExplanations: perAnswer,
        };
      }),
    };
  }
}
