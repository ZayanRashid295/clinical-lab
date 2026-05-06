import { Injectable, NotFoundException } from "@nestjs/common";
import { AchievementMetric, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  CreateAchievementDto,
  UpdateAchievementDto,
} from "./dto/achievement.dto";

const POINTS_PER_LEVEL = 200;

@Injectable()
export class AchievementsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  // -------- catalog (admin) --------
  async createAchievement(dto: CreateAchievementDto) {
    return this.prisma.achievement.create({ data: dto as any });
  }

  async listAchievements() {
    return this.prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { points: "asc" },
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
    const [points, streak, achievements, unlocked] = await Promise.all([
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

    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u]));

    const items = achievements.map((a) => {
      const u = unlockedMap.get(a.id);
      return {
        ...a,
        unlocked: !!u,
        unlockedAt: u?.unlockedAt ?? null,
        progress: u?.progress ?? 0,
      };
    });

    const recent = unlocked.slice(0, 5).map((u) => {
      const a = achievements.find((x) => x.id === u.achievementId);
      return {
        id: u.id,
        unlockedAt: u.unlockedAt,
        achievement: a ?? null,
      };
    });

    return {
      points: {
        total: points.total,
        level: points.level,
        nextLevelAt: points.level * POINTS_PER_LEVEL,
      },
      streak: {
        current: streak.currentStreak,
        longest: streak.longestStreak,
        lastActiveDate: streak.lastActiveDate,
      },
      counts: {
        unlocked: unlocked.length,
        total: achievements.length,
      },
      items,
      recent,
    };
  }

  // -------- engine --------
  /**
   * Record a unit of activity from anywhere in the app (e.g. a question
   * answered) and unlock any achievements whose threshold was crossed.
   * Best-effort — always swallows errors.
   */
  async recordActivity(
    userId: string,
    metric: AchievementMetric,
    amount = 1
  ): Promise<{ unlocked: string[]; pointsAwarded: number }> {
    if (!userId) return { unlocked: [], pointsAwarded: 0 };
    try {
      // Update streak first (counts as activity today)
      await this.touchStreak(userId);

      const achievements = await this.prisma.achievement.findMany({
        where: { metric, isActive: true },
      });

      if (achievements.length === 0) {
        return { unlocked: [], pointsAwarded: 0 };
      }

      const existing = await this.prisma.userAchievement.findMany({
        where: { userId, achievementId: { in: achievements.map((a) => a.id) } },
      });
      const existingMap = new Map(existing.map((e) => [e.achievementId, e]));

      const totalSoFar = await this.metricTotal(userId, metric);
      const newTotal = totalSoFar + amount;

      const unlocked: string[] = [];
      let pointsAwarded = 0;

      for (const a of achievements) {
        const prev = existingMap.get(a.id);
        const prevProgress = prev?.progress ?? 0;
        const nextProgress = Math.min(newTotal, a.threshold);

        const justUnlocked = !prev && nextProgress >= a.threshold;
        const stillProgress = !prev && nextProgress < a.threshold;

        if (prev) continue; // already unlocked

        if (justUnlocked) {
          await this.prisma.userAchievement.create({
            data: {
              userId,
              achievementId: a.id,
              progress: nextProgress,
            },
          });
          await this.awardPoints(
            userId,
            a.points,
            `Achievement unlocked: ${a.title}`,
            "ACHIEVEMENT",
            { achievementId: a.id }
          );
          await this.notifications.emit({
            userId,
            type: "ACHIEVEMENT_UNLOCKED",
            title: "Achievement unlocked!",
            message: `${a.title} (+${a.points} pts)`,
            data: { achievementId: a.id, code: a.code },
          });
          unlocked.push(a.id);
          pointsAwarded += a.points;
        } else if (stillProgress) {
          // Track partial progress so the UI can show progress bars.
          await this.prisma.userAchievement
            .create({
              data: { userId, achievementId: a.id, progress: nextProgress },
            })
            .catch(() => undefined);
        }
      }

      return { unlocked, pointsAwarded };
    } catch (e) {
      console.error("recordActivity failed:", (e as Error)?.message);
      return { unlocked: [], pointsAwarded: 0 };
    }
  }

  // -------- internals --------
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
        return this.prisma.questionPaper.count({
          where: { userId, isActive: true },
        });
      case "FLASHCARDS_REVIEWED":
        return this.prisma.flashcardReview.count({ where: { userId } });
      case "NOTES_CREATED":
        return this.prisma.studentNote.count({ where: { userId } });
      case "STREAK_DAYS": {
        const s = await this.prisma.userStreak.findUnique({
          where: { userId },
        });
        return s?.currentStreak ?? 0;
      }
      case "STUDY_MINUTES": {
        const sessions = await this.prisma.studySession.aggregate({
          where: { userId },
          _sum: { durationSeconds: true },
        });
        return Math.floor((sessions._sum.durationSeconds ?? 0) / 60);
      }
      case "DISCUSSION_POSTS":
        return this.prisma.discussion.count({ where: { authorId: userId } });
      case "GOAL_COMPLETED":
        return this.prisma.goalProgress.count({
          where: { userId, achieved: true },
        });
      default:
        return 0;
    }
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
      return;
    }
    const last = existing.lastActiveDate
      ? new Date(existing.lastActiveDate)
      : null;
    if (last) last.setHours(0, 0, 0, 0);

    const diffDays = last
      ? Math.round((today.getTime() - last.getTime()) / 86400000)
      : null;

    let next = existing.currentStreak;
    if (diffDays === 0) return; // already counted today
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
        title: `${next}-day streak!`,
        message: `You've studied ${next} days in a row. Keep it going!`,
        data: { streak: next },
      });
    }
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

    const newLevel = Math.max(1, Math.floor(updated.total / POINTS_PER_LEVEL) + 1);
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
  }

  async getLeaderboard(limit = 10) {
    return this.prisma.userPoints.findMany({
      orderBy: { total: "desc" },
      take: limit,
    });
  }

  async findUnlockedById(id: string) {
    const a = await this.prisma.achievement.findUnique({ where: { id } });
    if (!a) throw new NotFoundException("Achievement not found");
    return a;
  }
}
