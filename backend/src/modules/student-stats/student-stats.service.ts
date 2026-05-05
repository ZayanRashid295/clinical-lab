import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StudyTaskStatus } from "@prisma/client";

@Injectable()
export class StudentStatsService {
  constructor(private prisma: PrismaService) {}

  /** Aggregated student dashboard stats. Always returns numbers (never null). */
  async getDashboard(userId: string) {
    const [
      totalQuestions,
      papers,
      answeredAggregate,
      bookmarks,
      flashcardsTotal,
      flashcardsDue,
      notesCount,
      activePlan,
    ] = await Promise.all([
      this.prisma.question.count({ where: { isActive: true } }),
      this.prisma.questionPaper.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          type: true,
          totalQuestions: true,
          updatedAt: true,
          createdAt: true,
          questionPaperQuestions: {
            select: { userAnswer: true, isCorrect: true },
          },
        },
      }),
      this.prisma.questionPaperQuestion.aggregate({
        where: {
          questionPaper: { userId },
          userAnswer: { not: null },
        },
        _count: { _all: true },
      }),
      this.prisma.bookmark.count({ where: { userId } }),
      this.prisma.flashcard.count({ where: { userId } }),
      this.prisma.flashcard.count({
        where: { userId, dueAt: { lte: new Date() } },
      }),
      this.prisma.studentNote.count({ where: { userId } }),
      this.prisma.studyPlan.findFirst({
        where: { userId, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalAttempted = answeredAggregate._count._all;
    const correctAggregate = await this.prisma.questionPaperQuestion.count({
      where: {
        questionPaper: { userId },
        userAnswer: { not: null },
        isCorrect: true,
      },
    });

    const annotatedPapers = papers.map((p) => {
      const total = p.questionPaperQuestions.length;
      const answered = p.questionPaperQuestions.filter(
        (q) => q.userAnswer !== null && q.userAnswer !== undefined
      ).length;
      const correct = p.questionPaperQuestions.filter(
        (q) => q.isCorrect === true
      ).length;
      const isCompleted = total > 0 && answered === total;
      const isInProgress = answered > 0 && answered < total;
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        totalQuestions: total || p.totalQuestions,
        answered,
        correct,
        isCompleted,
        isInProgress,
        updatedAt: p.updatedAt,
        createdAt: p.createdAt,
      };
    });
    const completedPapers = annotatedPapers.filter((p) => p.isCompleted).length;
    const inProgressPaper = annotatedPapers.find((p) => p.isInProgress) ?? null;
    const lastTest = annotatedPapers[0] ?? null;

    let planProgress = {
      total: 0,
      completed: 0,
      overdue: 0,
      incomplete: 0,
      percent: 0,
      daysRemaining: 0,
    };
    if (activePlan) {
      const now = new Date();
      const [total, completed, overdue] = await Promise.all([
        this.prisma.studyTask.count({ where: { studyPlanId: activePlan.id } }),
        this.prisma.studyTask.count({
          where: {
            studyPlanId: activePlan.id,
            status: StudyTaskStatus.COMPLETED,
          },
        }),
        this.prisma.studyTask.count({
          where: {
            studyPlanId: activePlan.id,
            status: { not: StudyTaskStatus.COMPLETED },
            scheduledFor: { lt: now },
          },
        }),
      ]);
      const incomplete = Math.max(total - completed - overdue, 0);
      planProgress = {
        total,
        completed,
        overdue,
        incomplete,
        percent:
          total === 0 ? 0 : Math.round((completed / total) * 10000) / 100,
        daysRemaining: Math.max(
          Math.ceil(
            (activePlan.endDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          0
        ),
      };
    }

    const accuracyPercent =
      totalAttempted === 0
        ? 0
        : Math.round((correctAggregate / totalAttempted) * 10000) / 100;
    const qbankUsagePercent =
      totalQuestions === 0
        ? 0
        : Math.round((totalAttempted / totalQuestions) * 10000) / 100;
    const testCompletionPercent =
      annotatedPapers.length === 0
        ? 0
        : Math.round((completedPapers / annotatedPapers.length) * 10000) / 100;

    return {
      questionScore: {
        correct: correctAggregate,
        attempted: totalAttempted,
        percent: accuracyPercent,
      },
      qbankUsage: {
        used: totalAttempted,
        total: totalQuestions,
        percent: qbankUsagePercent,
      },
      tests: {
        total: annotatedPapers.length,
        completed: completedPapers,
        percent: testCompletionPercent,
        lastTest,
        inProgress: inProgressPaper,
      },
      bookmarks,
      flashcards: { total: flashcardsTotal, due: flashcardsDue },
      notes: notesCount,
      plan: { active: activePlan, progress: planProgress },
    };
  }
}
