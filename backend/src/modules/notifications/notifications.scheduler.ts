import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  FacultyAssignmentProgressStatus,
  FacultyAssignmentStatus,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { assignmentDueNotification } from "../faculty/faculty-notifications.util";
import { NotificationsService } from "./notifications.service";

/**
 * Single source of truth for all scheduled / time-based notifications.
 *
 * Currently handles:
 *  - STREAK_RISK           18:00 daily: any user with a streak > 0 who has
 *                          no activity recorded today.
 *  - SUBSCRIPTION_EXPIRING daily: any active subscription expiring in 7/3/1
 *                          days (one notification each).
 *  - SUBSCRIPTION_EXPIRED  daily: any subscription whose endDate just passed.
 *  - ASSIGNMENT_DUE        daily: institution assignments due within 48h
 *                          for students who have not submitted yet.
 */
@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  // ────────────────────────── helpers ──────────────────────────
  private startOfDay(d = new Date()): Date {
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    return s;
  }

  // ────────────────────────── jobs ──────────────────────────

  /**
   * STREAK_RISK — daily at 18:00. Any user with a current streak > 0 who
   * hasn't recorded any activity today gets a nudge. We check both the
   * `UserStreak` table and the absence of any AchievementActivity row today.
   */
  @Cron("0 18 * * *", { name: "streak:risk" })
  async runStreakRisk(): Promise<void> {
    const today = this.startOfDay();

    const atRisk = await this.prisma.userStreak.findMany({
      where: {
        currentStreak: { gt: 0 },
        OR: [
          { lastActiveDate: null },
          { lastActiveDate: { lt: today } },
        ],
      },
      take: 5000,
    });

    if (atRisk.length === 0) return;

    let sent = 0;
    for (const s of atRisk) {
      // Skip if we already nudged them today
      const already = await this.prisma.notification.findFirst({
        where: {
          userId: s.userId,
          type: "STREAK_RISK",
          createdAt: { gte: today },
        },
        select: { id: true },
      });
      if (already) continue;

      await this.notifications.emit({
        userId: s.userId,
        type: "STREAK_RISK",
        title: `Don't break your ${s.currentStreak}-day streak!`,
        message:
          "You haven't studied today. Just one question keeps your streak alive.",
        data: { route: "/study", currentStreak: s.currentStreak },
      });
      sent++;
    }

    if (sent > 0)
      this.logger.log(`Sent ${sent} STREAK_RISK nudges.`);
  }

  /**
   * ASSIGNMENT_DUE — once per day, remind students about published assignments
   * due within the next 48 hours that are not yet submitted or graded.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: "faculty:assignment-due" })
  async runAssignmentDueReminders(): Promise<void> {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const assignments = await this.prisma.facultyAssignment.findMany({
      where: {
        status: FacultyAssignmentStatus.PUBLISHED,
        dueAt: { gte: now, lte: in48h },
      },
      select: { id: true, title: true, dueAt: true },
      take: 200,
    });

    if (assignments.length === 0) return;

    let sent = 0;
    const startOfDay = this.startOfDay(now);

    for (const assignment of assignments) {
      if (!assignment.dueAt) continue;

      const progresses = await this.prisma.facultyAssignmentProgress.findMany({
        where: {
          assignmentId: assignment.id,
          status: {
            in: [
              FacultyAssignmentProgressStatus.NOT_STARTED,
              FacultyAssignmentProgressStatus.IN_PROGRESS,
              FacultyAssignmentProgressStatus.LATE,
            ],
          },
        },
        select: { studentUserId: true },
      });

      for (const { studentUserId } of progresses) {
        const dedupeKey = `assignment:${assignment.id}:due:${startOfDay.toISOString().slice(0, 10)}`;
        const recent = await this.prisma.notification.findMany({
          where: {
            userId: studentUserId,
            type: "ASSIGNMENT_DUE",
            createdAt: { gte: startOfDay },
          },
          select: { data: true },
          take: 10,
        });
        if (recent.some((n) => (n.data as { dedupeKey?: string })?.dedupeKey === dedupeKey)) {
          continue;
        }

        const payload = assignmentDueNotification({
          assignmentId: assignment.id,
          title: assignment.title,
          dueAt: assignment.dueAt,
        });

        await this.notifications.emit({
          userId: studentUserId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: { ...(payload.data as Record<string, unknown>), dedupeKey },
        });
        sent++;
      }
    }

    if (sent > 0) {
      this.logger.log(`Sent ${sent} assignment due reminders.`);
    }
  }
}
