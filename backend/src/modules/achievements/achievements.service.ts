import { Injectable, NotFoundException } from "@nestjs/common";
import { AchievementMetric, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RealtimeBus } from "../realtime/realtime.bus";
import {
  CreateAchievementDto,
  UpdateAchievementDto,
} from "./dto/achievement.dto";

const POINTS_PER_LEVEL = 200;

@Injectable()
export class AchievementsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private realtime: RealtimeBus
  ) {}

  // -------- catalog (admin) --------
  async createAchievement(dto: CreateAchievementDto) {
    return this.prisma.achievement.create({ data: dto as any });
  }

  async listAchievements() {
    return this.prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { threshold: "asc" }],
    });
  }

  async updateAchievement(id: string, dto: UpdateAchievementDto) {
    return this.prisma.achievement.update({
      where: { id },
      data: dto as any,
    });
  }

  async removeAchievement(id: string) {
    await this.prisma.achievement.delete({ where: { id } });
    return { message: "Achievement deleted" };
  }

  // -------- user view --------
  async getUserOverview(userId: string) {
    /**
     * Many flows (e.g. tutor mode) persist answers via PATCH only and never call
     * POST …/submit — so `recordActivity` may never run. Reconcile progress from
     * live DB totals before returning the catalog so badges/points catch up.
     */
    await this.reconcileAchievementsFromMetricTotals(userId);
    await this.reconcileStreakFromActivity(userId);

    const [pointsRow, streak, achievements, unlockedRows] = await Promise.all([
      this.prisma.userPoints.upsert({
        where: { userId },
        create: { userId },
        update: {},
      }),
      this.prisma.userStreak.upsert({
        where: { userId },
        create: { userId },
        update: {},
      }),
      this.prisma.achievement.findMany({ where: { isActive: true } }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
      }),
    ]);

    const derivedLevel = Math.max(
      1,
      Math.floor(pointsRow.total / POINTS_PER_LEVEL) + 1
    );
    if (derivedLevel !== pointsRow.level) {
      await this.prisma.userPoints.update({
        where: { userId },
        data: { level: derivedLevel },
      });
    }

    const total = pointsRow.total;
    const level = derivedLevel;
    const pointsIntoLevel = total % POINTS_PER_LEVEL;
    const progressToNextLevel = Math.round(
      (pointsIntoLevel / POINTS_PER_LEVEL) * 100
    );
    const nextLevelTotalPoints = level * POINTS_PER_LEVEL;

    const unlockedMap = new Map(
      unlockedRows.map((u) => [u.achievementId, u])
    );

    const items = achievements.map((a) => {
      const u = unlockedMap.get(a.id);
      const done = u ? u.progress >= a.threshold : false;
      return {
        ...a,
        unlocked: done,
        unlockedAt: done ? u?.unlockedAt ?? null : null,
        progress: u?.progress ?? 0,
      };
    });

    const recent = unlockedRows
      .filter((u) => {
        const a = achievements.find((x) => x.id === u.achievementId);
        return a && u.progress >= a.threshold;
      })
      .slice(0, 8)
      .map((u) => {
        const a = achievements.find((x) => x.id === u.achievementId);
        return {
          id: u.id,
          unlockedAt: u.unlockedAt,
          achievement: a ?? null,
        };
      });

    const unlockedCount = items.filter((i) => i.unlocked).length;

    return {
      points: {
        total,
        level,
        pointsIntoLevel,
        pointsPerLevel: POINTS_PER_LEVEL,
        progressToNextLevel,
        nextLevelTotalPoints,
      },
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        lastActiveDate: streak.lastActiveDate,
      },
      counts: {
        unlocked: unlockedCount,
        total: achievements.length,
      },
      items,
      recent,
    };
  }

  // -------- engine --------
  /**
   * Record activity (e.g. question answered). Updates streak when relevant,
   * evaluates achievements for that metric, and after streak changes evaluates
   * streak-based badges.
   */
  /** Backfill `user_achievements` + awards from current metric totals (amount 0). */
  private async reconcileAchievementsFromMetricTotals(userId: string) {
    const grouped = await this.prisma.achievement.groupBy({
      by: ["metric"],
      where: { isActive: true },
    });
    for (const row of grouped) {
      try {
        await this.progressAchievements(userId, row.metric, 0);
      } catch (e) {
        console.error(
          `reconcile metric ${row.metric}:`,
          (e as Error)?.message
        );
      }
    }
  }

  /**
   * If a user already did things (answered questions etc.) before some flows were
   * wired to call `recordActivity`, their `user_streaks` row may still be empty.
   * We derive "latest activity" from real data and ensure today's streak is
   * counted when there was activity today.
   */
  private async reconcileStreakFromActivity(userId: string) {
    const existing = await this.prisma.userStreak.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const latest = await this.getLatestActivityDate(userId);
    if (!latest) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const latestDay = new Date(latest);
    latestDay.setHours(0, 0, 0, 0);

    // If the user was active today, ensure streak is touched today (idempotent).
    if (latestDay.getTime() === today.getTime()) {
      const last = existing.lastActiveDate ? new Date(existing.lastActiveDate) : null;
      if (last) last.setHours(0, 0, 0, 0);
      if (!last || last.getTime() !== today.getTime()) {
        await this.touchStreak(userId);
      }
      return;
    }

    // If we have historical activity but an empty streak row, seed a baseline.
    if (!existing.lastActiveDate && existing.currentStreak === 0) {
      await this.prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: latestDay,
        },
      });
      await this.refreshStreakAchievements(userId);
    }
  }

  private async getLatestActivityDate(userId: string): Promise<Date | null> {
    const [
      qpq,
      mockAttempt,
      discussion,
      reply,
      aiMsg,
      medprep,
      task,
      groupPost,
      report,
      feedback,
    ] = await Promise.all([
      this.prisma.questionPaperQuestion.findFirst({
        where: { questionPaper: { userId }, userAnswer: { not: null } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      this.prisma.mockExamAttempt.findFirst({
        where: { userId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      }),
      this.prisma.discussion.findFirst({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.discussionReply.findFirst({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.aiTutorMessage.findFirst({
        where: { role: "USER", conversation: { userId } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.medprepConversation.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      this.prisma.studyTask.findFirst({
        where: { userId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      }),
      this.prisma.studyGroupPost.findFirst({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.questionReport.findFirst({
        where: { reporterId: userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.feedbackTicket.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const dates = [
      qpq?.updatedAt ?? null,
      mockAttempt?.completedAt ?? null,
      discussion?.createdAt ?? null,
      reply?.createdAt ?? null,
      aiMsg?.createdAt ?? null,
      medprep?.updatedAt ?? null,
      task?.completedAt ?? null,
      groupPost?.createdAt ?? null,
      report?.createdAt ?? null,
      feedback?.createdAt ?? null,
    ].filter((d): d is Date => d instanceof Date);

    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }

  async recordActivity(
    userId: string,
    metric: AchievementMetric,
    amount = 1
  ): Promise<{ unlocked: string[]; pointsAwarded: number }> {
    if (!userId) return { unlocked: [], pointsAwarded: 0 };
    try {
      if (metric !== "STREAK_DAYS") {
        await this.touchStreak(userId);
      }
      return await this.progressAchievements(userId, metric, amount);
    } catch (e) {
      console.error("recordActivity failed:", (e as Error)?.message);
      return { unlocked: [], pointsAwarded: 0 };
    }
  }

  private async progressAchievements(
    userId: string,
    metric: AchievementMetric,
    amount: number
  ): Promise<{ unlocked: string[]; pointsAwarded: number }> {
    const achievements = await this.prisma.achievement.findMany({
      where: { metric, isActive: true },
    });
    if (achievements.length === 0) {
      return { unlocked: [], pointsAwarded: 0 };
    }

    const existing = await this.prisma.userAchievement.findMany({
      where: {
        userId,
        achievementId: { in: achievements.map((a) => a.id) },
      },
    });
    const existingMap = new Map(existing.map((e) => [e.achievementId, e]));

    // Always derive totals from DB state so PATCH-only flows and submits never double-count.
    const newTotal = await this.metricTotal(userId, metric);

    const unlocked: string[] = [];
    let pointsAwarded = 0;

    for (const a of achievements) {
      const prev = existingMap.get(a.id);
      if (prev && prev.progress >= a.threshold) continue;

      const nextProgress = Math.min(newTotal, a.threshold);

      if (!prev) {
        if (nextProgress >= a.threshold) {
          await this.prisma.userAchievement.create({
            data: {
              userId,
              achievementId: a.id,
              progress: nextProgress,
            },
          });
          pointsAwarded += await this.grantAchievementRewards(userId, a);
          unlocked.push(a.id);
        } else if (nextProgress > 0) {
          await this.prisma.userAchievement
            .create({
              data: { userId, achievementId: a.id, progress: nextProgress },
            })
            .catch(() => undefined);
        }
        continue;
      }

      if (nextProgress >= a.threshold) {
        await this.prisma.userAchievement.update({
          where: { id: prev.id },
          data: { progress: nextProgress },
        });
        pointsAwarded += await this.grantAchievementRewards(userId, a);
        unlocked.push(a.id);
      } else if (nextProgress > prev.progress) {
        await this.prisma.userAchievement.update({
          where: { id: prev.id },
          data: { progress: nextProgress },
        });
      }
    }

    return { unlocked, pointsAwarded };
  }

  /** Points + notifications for a newly completed achievement row. */
  private async grantAchievementRewards(
    userId: string,
    a: { id: string; code: string; title: string; points: number }
  ): Promise<number> {
    await this.awardPoints(
      userId,
      a.points,
      `Achievement unlocked: ${a.title}`,
      "ACHIEVEMENT",
      { achievementId: a.id, code: a.code }
    );
    await this.notifications.emit({
      userId,
      type: "ACHIEVEMENT_UNLOCKED",
      title: "Achievement unlocked",
      message: `${a.title} (+${a.points} pts)`,
      data: { achievementId: a.id, code: a.code },
    });
    this.realtime.emitToUser(userId, "achievements:updated", {
      achievementId: a.id,
      code: a.code,
      at: new Date().toISOString(),
    });
    return a.points;
  }

  private async metricTotal(
    userId: string,
    metric: AchievementMetric
  ): Promise<number> {
    switch (metric) {
      case "QUESTIONS_ANSWERED":
        return this.prisma.questionPaperQuestion.count({
          where: {
            userAnswer: { not: null },
            questionPaper: { userId },
          },
        });
      case "CORRECT_ANSWERS":
        return this.prisma.questionPaperQuestion.count({
          where: { isCorrect: true, questionPaper: { userId } },
        });
      case "TESTS_COMPLETED":
        return this.countFullyAnsweredQuestionPapers(userId);
      case "STREAK_DAYS": {
        const s = await this.prisma.userStreak.findUnique({
          where: { userId },
        });
        return s?.currentStreak ?? 0;
      }
      case "STUDY_MINUTES": {
        const [sessionAgg, qpqAgg, mockAgg] = await Promise.all([
          this.prisma.studySession.aggregate({
            where: { userId },
            _sum: { durationSeconds: true },
          }),
          this.prisma.questionPaperQuestion.aggregate({
            where: {
              questionPaper: { userId },
              timeSpent: { not: null },
            },
            _sum: { timeSpent: true },
          }),
          this.prisma.mockExamAttempt.aggregate({
            where: { userId, status: "COMPLETED" },
            _sum: { timeSpentSeconds: true },
          }),
        ]);
        const sec =
          (sessionAgg._sum.durationSeconds ?? 0) +
          (qpqAgg._sum.timeSpent ?? 0) +
          (mockAgg._sum.timeSpentSeconds ?? 0);
        return Math.floor(sec / 60);
      }
      case "DISCUSSION_POSTS": {
        const [threads, replies] = await Promise.all([
          this.prisma.discussion.count({ where: { authorId: userId } }),
          this.prisma.discussionReply.count({ where: { authorId: userId } }),
        ]);
        return threads + replies;
      }
      case "AI_TUTOR_MESSAGES":
        return this.prisma.aiTutorMessage.count({
          where: { role: "USER", conversation: { userId } },
        });
      case "STUDY_TASKS_COMPLETED":
        return this.prisma.studyTask.count({
          where: { userId, status: "COMPLETED" },
        });
      case "STUDY_GROUP_POSTS":
        return this.prisma.studyGroupPost.count({
          where: { authorId: userId },
        });
      case "MEDPREP_CONVERSATIONS":
        return this.prisma.medprepConversation.count({ where: { userId } });
      case "QUESTION_REPORTS_SUBMITTED":
        return this.prisma.questionReport.count({
          where: { reporterId: userId },
        });
      case "FEEDBACK_TICKETS_SUBMITTED":
        return this.prisma.feedbackTicket.count({ where: { userId } });
      case "MOCK_EXAMS_COMPLETED":
        return this.prisma.mockExamAttempt.count({
          where: { userId, status: "COMPLETED" },
        });
      case "STUDY_GROUPS_JOINED":
        return this.prisma.studyGroupMember.count({ where: { userId } });
      default:
        return 0;
    }
  }

  /** Question papers where every slot has a non-empty answer (treated as a completed attempt). */
  private async countFullyAnsweredQuestionPapers(userId: string): Promise<number> {
    const papers = await this.prisma.questionPaper.findMany({
      where: { userId },
      select: {
        questionPaperQuestions: {
          select: { userAnswer: true },
        },
      },
    });
    let n = 0;
    for (const p of papers) {
      const qs = p.questionPaperQuestions;
      if (qs.length === 0) continue;
      const allAnswered = qs.every(
        (q) =>
          q.userAnswer != null && String(q.userAnswer).trim().length > 0
      );
      if (allAnswered) n++;
    }
    return n;
  }

  private async touchStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.userStreak.findUnique({
      where: { userId },
    });
    if (!existing) {
      await this.prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: today,
        },
      });
      await this.refreshStreakAchievements(userId);
      return;
    }
    const last = existing.lastActiveDate
      ? new Date(existing.lastActiveDate)
      : null;
    if (last) last.setHours(0, 0, 0, 0);

    const diffDays = last
      ? Math.round((today.getTime() - last.getTime()) / 86400000)
      : null;

    if (diffDays === 0) return;

    let next = existing.currentStreak;
    if (diffDays === 1) next = existing.currentStreak + 1;
    else next = 1;

    await this.prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: next,
        longestStreak: Math.max(existing.longestStreak, next),
        lastActiveDate: today,
      },
    });

    if (next % 7 === 0) {
      await this.notifications.emit({
        userId,
        type: "STREAK_MILESTONE",
        title: `${next}-day streak`,
        message: `You've studied ${next} days in a row. Keep it going.`,
        data: { streak: next },
      });
    }

    await this.refreshStreakAchievements(userId);
  }

  private async refreshStreakAchievements(userId: string) {
    await this.progressAchievements(userId, "STREAK_DAYS", 0);
  }

  private async awardPoints(
    userId: string,
    amount: number,
    reason: string,
    source: string,
    meta?: Record<string, any>
  ) {
    if (amount <= 0) return;
    const updated = await this.prisma.userPoints.upsert({
      where: { userId },
      update: { total: { increment: amount } },
      create: { userId, total: amount },
    });

    const newLevel = Math.max(
      1,
      Math.floor(updated.total / POINTS_PER_LEVEL) + 1
    );
    if (newLevel !== updated.level) {
      await this.prisma.userPoints.update({
        where: { userId },
        data: { level: newLevel },
      });
    }

    await this.prisma.pointsLedger.create({
      data: {
        userId,
        amount,
        reason,
        source,
        meta: (meta as Prisma.InputJsonValue) ?? undefined,
      },
    });

    await this.publishLeaderboardSnapshot();
  }

  async publishLeaderboardSnapshot(limit = 30) {
    const rows = await this.getLeaderboard(limit);
    this.realtime.emitToLaunch("leaderboard:update", {
      entries: rows,
      generatedAt: new Date().toISOString(),
    });
  }

  async getLeaderboard(limit = 10) {
    return this.prisma.userPoints.findMany({
      orderBy: { total: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    });
  }

  async findUnlockedById(id: string) {
    const a = await this.prisma.achievement.findUnique({ where: { id } });
    if (!a) throw new NotFoundException("Achievement not found");
    return a;
  }
}
