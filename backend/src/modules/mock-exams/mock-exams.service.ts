import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AchievementsService } from "../achievements/achievements.service";
import {
  CreateMockExamDto,
  SubmitMockExamDto,
  UpdateMockExamDto,
} from "./dto/mock-exam.dto";

@Injectable()
export class MockExamsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private achievements: AchievementsService
  ) {}

  // ---------- catalog ----------
  async create(dto: CreateMockExamDto, createdById?: string) {
    const exam = await this.prisma.mockExam.create({
      data: {
        ...dto,
        systemIds: (dto.systemIds as Prisma.InputJsonValue) ?? undefined,
        topicIds: (dto.topicIds as Prisma.InputJsonValue) ?? undefined,
        createdById: createdById ?? null,
      } as any,
    });

    if (exam.isPublished) {
      void this.notifications
        .emitToRoles(
          ["STUDENT"],
          {
            type: "MOCK_EXAM_PUBLISHED",
            title: "New mock exam available",
            message: `"${exam.title}" — ${exam.totalQuestions} questions, ${exam.durationMinutes} min.`,
            data: { mockExamId: exam.id },
          },
          createdById
        )
        .catch(() => undefined);
    }

    return exam;
  }

  async list(opts: { onlyPublished?: boolean } = {}) {
    return this.prisma.mockExam.findMany({
      where: opts.onlyPublished ? { isPublished: true } : {},
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const exam = await this.prisma.mockExam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException("Mock exam not found");
    return exam;
  }

  async update(id: string, dto: UpdateMockExamDto) {
    const before = await this.prisma.mockExam.findUnique({ where: { id } });
    const exam = await this.prisma.mockExam.update({
      where: { id },
      data: {
        ...dto,
        systemIds:
          dto.systemIds !== undefined
            ? (dto.systemIds as Prisma.InputJsonValue)
            : undefined,
        topicIds:
          dto.topicIds !== undefined
            ? (dto.topicIds as Prisma.InputJsonValue)
            : undefined,
      } as any,
    });

    // If the exam just transitioned from draft to published, broadcast
    if (before && !before.isPublished && exam.isPublished) {
      void this.notifications
        .emitToRoles(["STUDENT"], {
          type: "MOCK_EXAM_PUBLISHED",
          title: "New mock exam available",
          message: `"${exam.title}" — ${exam.totalQuestions} questions, ${exam.durationMinutes} min.`,
          data: { mockExamId: exam.id },
        })
        .catch(() => undefined);
    }

    return exam;
  }

  async remove(id: string) {
    await this.prisma.mockExam.delete({ where: { id } });
    return { message: "Mock exam deleted" };
  }

  // ---------- attempts ----------
  async start(userId: string, mockExamId: string) {
    const exam = await this.findOne(mockExamId);
    if (!exam.isPublished) {
      throw new ForbiddenException("This mock exam is not available");
    }

    // Pull a random pool of questions matching configured filters
    const where: any = {};
    const systemIds = (exam.systemIds as string[] | null) ?? [];
    const topicIds = (exam.topicIds as string[] | null) ?? [];
    if (systemIds?.length) where.systemId = { in: systemIds };
    if (topicIds?.length) where.topicId = { in: topicIds };

    const candidates = await this.prisma.question.findMany({
      where,
      select: { id: true },
      take: Math.max(exam.totalQuestions * 4, exam.totalQuestions),
    });

    if (candidates.length === 0) {
      // Fallback: any question
      const fallback = await this.prisma.question.findMany({
        select: { id: true },
        take: exam.totalQuestions * 2,
      });
      candidates.push(...fallback);
    }

    if (candidates.length === 0) {
      throw new NotFoundException(
        "No questions available to assemble this mock exam"
      );
    }

    const shuffled = candidates
      .map((q) => ({ q, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.q)
      .slice(0, exam.totalQuestions);

    const paper = await this.prisma.questionPaper.create({
      data: {
        userId,
        name: exam.title,
        description: exam.description ?? `Mock exam: ${exam.title}`,
        type: "mock",
        totalQuestions: shuffled.length,
        timeLimit: exam.durationMinutes,
      },
    });

    await this.prisma.questionPaperQuestion.createMany({
      data: shuffled.map((q, idx) => ({
        questionPaperId: paper.id,
        questionId: q.id,
        order: idx + 1,
      })),
    });

    const attempt = await this.prisma.mockExamAttempt.create({
      data: {
        mockExamId,
        userId,
        questionPaperId: paper.id,
        totalQuestions: shuffled.length,
      },
    });

    return { attempt, questionPaperId: paper.id };
  }

  async submit(
    userId: string,
    attemptId: string,
    dto: SubmitMockExamDto
  ) {
    const attempt = await this.prisma.mockExamAttempt.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) throw new NotFoundException("Attempt not found");
    if (attempt.userId !== userId) throw new ForbiddenException("Not yours");
    if (attempt.status !== "IN_PROGRESS") {
      throw new ForbiddenException("Attempt already completed");
    }

    // Persist answers via question paper questions; correctness is computed
    // by matching the user's answer against the question's correct choice text.
    let correct = 0;
    let totalTime = 0;
    for (const a of dto.answers) {
      const qpq = await this.prisma.questionPaperQuestion.findUnique({
        where: { id: a.questionPaperQuestionId },
        include: { question: { include: { choices: true } } },
      });
      if (!qpq) continue;
      const correctChoice = qpq.question.choices.find((c) => c.isCorrect);
      const isCorrect =
        !!a.userAnswer && !!correctChoice && a.userAnswer === correctChoice.text;
      if (isCorrect) correct++;
      totalTime += a.timeSpent ?? 0;
      await this.prisma.questionPaperQuestion.update({
        where: { id: qpq.id },
        data: {
          userAnswer: a.userAnswer,
          isCorrect,
          timeSpent: a.timeSpent ?? null,
          markedForReview: a.markedForReview ?? false,
        },
      });
    }

    const total = attempt.totalQuestions || dto.answers.length;
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

    const updated = await this.prisma.mockExamAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        correctAnswers: correct,
        scorePercent,
        timeSpentSeconds: totalTime,
      },
    });

    this.notifications.emit({
      userId,
      type: "MOCK_EXAM_RESULT",
      title: "Mock exam completed",
      message: `You scored ${scorePercent}% (${correct}/${total}).`,
      data: { mockExamId: attempt.mockExamId, attemptId },
    });

    void this.achievements
      .recordActivity(userId, "MOCK_EXAMS_COMPLETED" as any, 0)
      .catch(() => undefined);
    void this.achievements
      .recordActivity(userId, "QUESTIONS_ANSWERED" as any, 0)
      .catch(() => undefined);
    void this.achievements
      .recordActivity(userId, "CORRECT_ANSWERS" as any, 0)
      .catch(() => undefined);
    void this.achievements
      .recordActivity(userId, "TESTS_COMPLETED" as any, 0)
      .catch(() => undefined);
    void this.achievements
      .recordActivity(userId, "STUDY_MINUTES" as any, 0)
      .catch(() => undefined);

    return updated;
  }

  async listMyAttempts(userId: string) {
    return this.prisma.mockExamAttempt.findMany({
      where: { userId },
      include: { mockExam: true },
      orderBy: { startedAt: "desc" },
      take: 50,
    });
  }
}
