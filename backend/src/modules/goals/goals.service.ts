import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GoalMetric } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AchievementsService } from "../achievements/achievements.service";
import {
  CreateGoalDto,
  RecordGoalProgressDto,
  UpdateGoalDto,
} from "./dto/goal.dto";

function bucketKey(period: string, date = new Date()): string {
  const d = new Date(date);
  if (period === "DAILY") {
    return d.toISOString().slice(0, 10);
  }
  if (period === "WEEKLY") {
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
    );
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  return d.toISOString().slice(0, 7); // MONTHLY -> YYYY-MM
}

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private achievements: AchievementsService
  ) {}

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        metric: dto.metric as any,
        target: dto.target,
        period: (dto.period ?? "DAILY") as any,
        reminderEnabled: dto.reminderEnabled ?? true,
        reminderHour: dto.reminderHour ?? 18,
      },
    });
  }

  async listMy(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    // Hydrate today's progress per goal
    const enriched = await Promise.all(
      goals.map(async (g) => {
        const bucket = bucketKey(g.period);
        const progress = await this.prisma.goalProgress.findUnique({
          where: { goalId_bucket: { goalId: g.id, bucket } },
        });
        return {
          ...g,
          currentBucket: bucket,
          currentValue: progress?.value ?? 0,
          achievedThisBucket: progress?.achieved ?? false,
        };
      })
    );

    return enriched;
  }

  async findOne(userId: string, id: string) {
    const g = await this.prisma.goal.findUnique({ where: { id } });
    if (!g) throw new NotFoundException("Goal not found");
    if (g.userId !== userId) throw new ForbiddenException("Not yours");
    const recent = await this.prisma.goalProgress.findMany({
      where: { goalId: id },
      orderBy: { bucket: "desc" },
      take: 30,
    });
    return { ...g, history: recent };
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const g = await this.prisma.goal.findUnique({ where: { id } });
    if (!g) throw new NotFoundException("Goal not found");
    if (g.userId !== userId) throw new ForbiddenException("Not yours");
    return this.prisma.goal.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        metric: dto.metric as any,
        target: dto.target,
        period: dto.period as any,
        reminderEnabled: dto.reminderEnabled,
        reminderHour: dto.reminderHour,
        isActive: dto.isActive,
      },
    });
  }

  async remove(userId: string, id: string) {
    const g = await this.prisma.goal.findUnique({ where: { id } });
    if (!g) throw new NotFoundException("Goal not found");
    if (g.userId !== userId) throw new ForbiddenException("Not yours");
    await this.prisma.goal.delete({ where: { id } });
    return { message: "Goal deleted" };
  }

  /**
   * Record progress for ALL active goals matching the given metric.
   * Auto-marks bucket as achieved when target is hit and notifies.
   */
  async recordProgress(
    userId: string,
    metric: GoalMetric | string,
    amount = 1
  ) {
    const goals = await this.prisma.goal.findMany({
      where: { userId, isActive: true, metric: metric as any },
    });

    const updated: Array<{ goalId: string; achievedJustNow: boolean }> = [];

    for (const g of goals) {
      const bucket = bucketKey(g.period);
      const existing = await this.prisma.goalProgress.findUnique({
        where: { goalId_bucket: { goalId: g.id, bucket } },
      });

      const prev = existing?.value ?? 0;
      const next = prev + amount;
      const wasAchieved = existing?.achieved ?? false;
      const nowAchieved = next >= g.target;

      const justAchieved = !wasAchieved && nowAchieved;

      await this.prisma.goalProgress.upsert({
        where: { goalId_bucket: { goalId: g.id, bucket } },
        update: {
          value: next,
          achieved: nowAchieved,
          achievedAt: justAchieved ? new Date() : existing?.achievedAt,
        },
        create: {
          goalId: g.id,
          userId,
          bucket,
          value: next,
          achieved: nowAchieved,
          achievedAt: justAchieved ? new Date() : null,
        },
      });

      if (justAchieved) {
        this.notifications.emit({
          userId,
          type: "GOAL_COMPLETED",
          title: `Goal achieved: ${g.title}`,
          message: `You hit your ${g.period.toLowerCase()} target of ${g.target}. Great work!`,
          data: { goalId: g.id, bucket },
        });
        this.achievements
          .recordActivity(userId, "GOAL_COMPLETED" as any)
          .catch(() => undefined);
      } else if (nowAchieved && (next - prev) > 0 && next % Math.max(1, Math.floor(g.target / 2)) === 0) {
        this.notifications.emit({
          userId,
          type: "GOAL_PROGRESS",
          title: `Halfway there!`,
          message: `${g.title}: ${next}/${g.target}`,
          data: { goalId: g.id, bucket },
        });
      }

      updated.push({ goalId: g.id, achievedJustNow: justAchieved });
    }

    return { updated };
  }
}
