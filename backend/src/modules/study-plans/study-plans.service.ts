import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StudyTaskStatus, StudyTaskType } from "@prisma/client";
import {
  CreateStudyPlanDto,
  CreateStudyTaskDto,
  QueryStudyTasksDto,
  UpdateStudyPlanDto,
  UpdateStudyTaskDto,
} from "./dto/study-plan.dto";

@Injectable()
export class StudyPlansService {
  constructor(private prisma: PrismaService) {}

  // ────────── plans ──────────

  async getActiveOrLatest(userId: string) {
    const active = await this.prisma.studyPlan.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (active) return active;
    return this.prisma.studyPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listPlans(userId: string) {
    return this.prisma.studyPlan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createPlan(userId: string, dto: CreateStudyPlanDto) {
    await this.prisma.studyPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    return this.prisma.studyPlan.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        goal: dto.goal,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: true,
      },
    });
  }

  async updatePlan(userId: string, id: string, dto: UpdateStudyPlanDto) {
    const plan = await this.prisma.studyPlan.findUnique({ where: { id } });
    if (!plan || plan.userId !== userId) {
      throw new NotFoundException("Study plan not found");
    }
    return this.prisma.studyPlan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        goal: dto.goal,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deletePlan(userId: string, id: string) {
    const plan = await this.prisma.studyPlan.findUnique({ where: { id } });
    if (!plan || plan.userId !== userId) {
      throw new NotFoundException("Study plan not found");
    }
    await this.prisma.studyPlan.delete({ where: { id } });
    return { ok: true };
  }

  // ────────── tasks ──────────

  async listTasks(userId: string, q: QueryStudyTasksDto) {
    const where: any = { userId };
    if (q.status) where.status = q.status;
    if (q.date) {
      const start = new Date(q.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.scheduledFor = { gte: start, lt: end };
    } else if (q.from || q.to) {
      where.scheduledFor = {};
      if (q.from) where.scheduledFor.gte = new Date(q.from);
      if (q.to) where.scheduledFor.lte = new Date(q.to);
    }
    return this.prisma.studyTask.findMany({
      where,
      orderBy: [{ scheduledFor: "asc" }],
    });
  }

  async createTask(userId: string, dto: CreateStudyTaskDto) {
    let plan = await this.getActiveOrLatest(userId);
    if (!plan) {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 30);
      plan = await this.createPlan(userId, {
        name: "My Study Plan",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
    }
    return this.prisma.studyTask.create({
      data: {
        userId,
        studyPlanId: plan.id,
        title: dto.title,
        description: dto.description,
        type: dto.type ?? StudyTaskType.GENERAL,
        scheduledFor: new Date(dto.scheduledFor),
        durationMinutes: dto.durationMinutes ?? 30,
        systemId: dto.systemId,
        topicId: dto.topicId,
        subtopicId: dto.subtopicId,
        questionPaperId: dto.questionPaperId,
      },
    });
  }

  async updateTask(userId: string, id: string, dto: UpdateStudyTaskDto) {
    const task = await this.prisma.studyTask.findUnique({ where: { id } });
    if (!task || task.userId !== userId) {
      throw new NotFoundException("Study task not found");
    }
    const data: any = {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      durationMinutes: dto.durationMinutes,
      status: dto.status,
    };
    if (dto.status === StudyTaskStatus.COMPLETED) data.completedAt = new Date();
    if (dto.status && dto.status !== StudyTaskStatus.COMPLETED)
      data.completedAt = null;
    return this.prisma.studyTask.update({ where: { id }, data });
  }

  async deleteTask(userId: string, id: string) {
    const task = await this.prisma.studyTask.findUnique({ where: { id } });
    if (!task || task.userId !== userId) {
      throw new NotFoundException("Study task not found");
    }
    await this.prisma.studyTask.delete({ where: { id } });
    return { ok: true };
  }

  // ────────── progress ──────────

  async progress(userId: string) {
    const plan = await this.getActiveOrLatest(userId);
    if (!plan) {
      return {
        plan: null,
        total: 0,
        completed: 0,
        overdue: 0,
        incomplete: 0,
        percent: 0,
        daysRemaining: 0,
      };
    }
    const now = new Date();
    const [total, completed, overdue] = await Promise.all([
      this.prisma.studyTask.count({ where: { studyPlanId: plan.id } }),
      this.prisma.studyTask.count({
        where: { studyPlanId: plan.id, status: StudyTaskStatus.COMPLETED },
      }),
      this.prisma.studyTask.count({
        where: {
          studyPlanId: plan.id,
          status: { not: StudyTaskStatus.COMPLETED },
          scheduledFor: { lt: now },
        },
      }),
    ]);
    const incomplete = Math.max(total - completed - overdue, 0);
    const percent =
      total === 0 ? 0 : Math.round((completed / total) * 10000) / 100;
    const daysRemaining = Math.max(
      Math.ceil(
        (plan.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
      0
    );
    return {
      plan,
      total,
      completed,
      overdue,
      incomplete,
      percent,
      daysRemaining,
    };
  }
}
