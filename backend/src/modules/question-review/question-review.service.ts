import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StartReviewAttemptDto } from "./dto/start-review-attempt.dto";
import { UpdateReviewResponseDto } from "./dto/update-review-response.dto";

@Injectable()
export class QuestionReviewService {
  constructor(private prisma: PrismaService) {}

  async getBundleBySlug(slug: string) {
    const bundle = await this.prisma.questionReviewBundle.findFirst({
      where: { slug, isActive: true },
      include: {
        items: { orderBy: { order: "asc" }, select: { id: true, order: true } },
      },
    });
    if (!bundle) throw new NotFoundException("Review bundle not found");
    return {
      id: bundle.id,
      slug: bundle.slug,
      title: bundle.title,
      description: bundle.description,
      questionCount: bundle.items.length,
    };
  }

  async startAttempt(slug: string, dto: StartReviewAttemptDto) {
    const bundle = await this.prisma.questionReviewBundle.findFirst({
      where: { slug, isActive: true },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            question: {
              include: {
                choices: { orderBy: { order: "asc" } },
                questionStemBlocks: { orderBy: { order: "asc" } },
                explanationBlocks: { orderBy: { order: "asc" } },
                perAnswerExplanations: {
                  include: { blocks: { orderBy: { order: "asc" } } },
                },
                system: true,
                topic: true,
                subtopic: true,
              },
            },
          },
        },
      },
    });

    if (!bundle) throw new NotFoundException("Review bundle not found");
    if (!bundle.items.length) {
      throw new BadRequestException("This review bundle has no questions configured");
    }

    const attemptSecret = randomBytes(24).toString("hex");

    const attempt = await this.prisma.questionReviewAttempt.create({
      data: {
        bundleId: bundle.id,
        attemptSecret,
        reviewerName: dto.reviewerName.trim(),
        reviewerEmail: dto.reviewerEmail?.trim() || null,
        responses: {
          create: bundle.items.map((item) => ({
            questionId: item.questionId,
            order: item.order,
          })),
        },
      },
    });

    return {
      attemptId: attempt.id,
      attemptSecret,
      bundle: {
        slug: bundle.slug,
        title: bundle.title,
        description: bundle.description,
      },
      questions: bundle.items.map((item) =>
        this.mapQuestionForReview(item.question, item.order)
      ),
    };
  }

  async getAttempt(attemptId: string, attemptSecret: string) {
    const attempt = await this.assertAttemptAccess(attemptId, attemptSecret);
    const responses = await this.prisma.questionReviewResponse.findMany({
      where: { attemptId },
      orderBy: { order: "asc" },
      include: {
        question: {
          include: {
            choices: { orderBy: { order: "asc" } },
            questionStemBlocks: { orderBy: { order: "asc" } },
            explanationBlocks: { orderBy: { order: "asc" } },
            perAnswerExplanations: {
              include: { blocks: { orderBy: { order: "asc" } } },
            },
            system: true,
            topic: true,
            subtopic: true,
          },
        },
      },
    });

    return {
      attemptId: attempt.id,
      status: attempt.status,
      reviewerName: attempt.reviewerName,
      bundleId: attempt.bundleId,
      questions: responses.map((r) => ({
        ...this.mapQuestionForReview(r.question, r.order),
        response: {
          userAnswer: r.userAnswer,
          isCorrect: r.isCorrect,
          qualityComment: r.qualityComment,
          timeSpent: r.timeSpent,
        },
      })),
    };
  }

  async updateResponse(
    attemptId: string,
    questionId: string,
    attemptSecret: string,
    dto: UpdateReviewResponseDto
  ) {
    const attempt = await this.assertAttemptAccess(attemptId, attemptSecret);
    if (attempt.status === "COMPLETED") {
      throw new BadRequestException("This review session is already completed");
    }

    const response = await this.prisma.questionReviewResponse.findFirst({
      where: { attemptId, questionId },
    });
    if (!response) throw new NotFoundException("Question not found in this review");

    return this.prisma.questionReviewResponse.update({
      where: { id: response.id },
      data: {
        userAnswer: dto.userAnswer,
        isCorrect: dto.isCorrect,
        qualityComment: dto.qualityComment?.trim(),
        timeSpent: dto.timeSpent,
      },
    });
  }

  async completeAttempt(attemptId: string, attemptSecret: string) {
    const attempt = await this.assertAttemptAccess(attemptId, attemptSecret);
    if (attempt.status === "COMPLETED") {
      return { message: "Already completed", attemptId };
    }

    const responses = await this.prisma.questionReviewResponse.findMany({
      where: { attemptId },
    });

    const unanswered = responses.filter((r) => !r.userAnswer?.trim());
    if (unanswered.length) {
      throw new BadRequestException(
        `Please answer all questions before submitting (${unanswered.length} remaining)`
      );
    }

    const missingComments = responses.filter((r) => !r.qualityComment?.trim());
    if (missingComments.length) {
      throw new BadRequestException(
        `A quality comment is required on every question (${missingComments.length} missing)`
      );
    }

    await this.prisma.questionReviewAttempt.update({
      where: { id: attemptId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return {
      message: "Review submitted successfully. Thank you!",
      attemptId,
      questionCount: responses.length,
    };
  }

  // ---------- admin ----------

  async listBundlesAdmin() {
    const bundles = await this.prisma.questionReviewBundle.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { items: true, attempts: true } },
      },
    });
    return bundles.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      description: b.description,
      isActive: b.isActive,
      questionCount: b._count.items,
      attemptCount: b._count.attempts,
    }));
  }

  async listAttemptsAdmin(bundleId?: string) {
    return this.prisma.questionReviewAttempt.findMany({
      where: bundleId ? { bundleId } : undefined,
      orderBy: { startedAt: "desc" },
      include: {
        bundle: { select: { slug: true, title: true } },
        _count: { select: { responses: true } },
      },
    });
  }

  async getAttemptAdmin(attemptId: string) {
    const attempt = await this.prisma.questionReviewAttempt.findUnique({
      where: { id: attemptId },
      include: {
        bundle: true,
        responses: {
          orderBy: { order: "asc" },
          include: {
            question: {
              select: {
                id: true,
                title: true,
                question: true,
                system: { select: { name: true } },
                topic: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException("Attempt not found");
    return attempt;
  }

  private async assertAttemptAccess(attemptId: string, attemptSecret: string) {
    const attempt = await this.prisma.questionReviewAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) throw new NotFoundException("Review session not found");
    if (attempt.attemptSecret !== attemptSecret) {
      throw new ForbiddenException("Invalid review session credentials");
    }
    return attempt;
  }

  private mapQuestionForReview(question: any, order: number) {
    const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const options = (question.choices ?? []).map((choice: any, index: number) => ({
      label: labels[index] ?? String(index + 1),
      text: choice.text,
      correct: choice.isCorrect,
    }));

    const explanation = (question.explanationBlocks ?? [])
      .map((block: any) => this.mapExplanationBlock(block))
      .filter(Boolean);

    const perAnswerExplanations: Record<string, any> = {};
    for (const pae of question.perAnswerExplanations ?? []) {
      const label = pae.choiceLabel || pae.choiceId;
      if (label) {
        const blocks = (pae.blocks ?? [])
          .map((b: any) => this.mapExplanationBlock(b))
          .filter(Boolean);
        if (blocks.length) {
          perAnswerExplanations[label] = blocks;
        }
      }
    }

    return {
      order,
      id: question.id,
      stem: question.question,
      title: question.title,
      system: question.system?.name ?? null,
      topic: question.topic?.name ?? null,
      questionStemBlocks: question.questionStemBlocks ?? [],
      options,
      explanation,
      perAnswerExplanations,
    };
  }

  /** Shape explanation blocks for RichContentRenderer (matches student question view). */
  private mapExplanationBlock(block: any) {
    if (!block) return null;

    if (
      block.type === "PER_ANSWER_EXPLANATION" ||
      (block.data &&
        (block.data.placeholder === true || block.data.isPerAnswerExplanation === true))
    ) {
      return {
        id: block.id,
        type: "per-answer-explanation",
        data: { placeholder: true },
      };
    }

    if (block.type === "TEXT") {
      const blockData = block.data ?? {};
      return {
        id: block.id,
        type: "text",
        data: {
          html: blockData.html || "",
          markdown:
            blockData.markdown ||
            blockData.content ||
            (typeof blockData === "string" ? blockData : ""),
          ...blockData,
        },
      };
    }

    if (block.type === "TABLE") {
      const blockData = block.data ?? {};
      return {
        id: block.id,
        type: "table",
        data: blockData.tableHtml
          ? blockData
          : { ...blockData, tableHtml: blockData.html || blockData.tableHtml },
      };
    }

    if (block.type === "IMAGES") {
      return {
        id: block.id,
        type: "images",
        data: block.data ?? {},
      };
    }

    return {
      id: block.id,
      type: "text",
      data: block.data ?? {},
    };
  }
}
