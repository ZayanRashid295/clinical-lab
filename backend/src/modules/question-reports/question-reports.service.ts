import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AchievementsService } from "../achievements/achievements.service";
import {
  CreateQuestionReportDto,
  UpdateQuestionReportDto,
} from "./dto/question-report.dto";

@Injectable()
export class QuestionReportsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private achievements: AchievementsService
  ) {}

  async create(userId: string, dto: CreateQuestionReportDto) {
    const report = await this.prisma.questionReport.create({
      data: {
        reporterId: userId,
        questionId: dto.questionId,
        reason: dto.reason as any,
        details: dto.details,
      },
    });

    // Fan out to admins/faculty so they can triage
    void this.notifications
      .emitToRoles(
        ["SUPERADMIN", "ADMIN", "FACULTY"],
        {
          type: "QUESTION_REPORT_CREATED",
          title: `New question report: ${report.reason.replace("_", " ").toLowerCase()}`,
          message:
            (report.details ?? "A user reported a question for review.").slice(
              0,
              160
            ),
          data: { reportId: report.id, questionId: report.questionId },
        },
        userId
      )
      .catch(() => undefined);

    void this.achievements
      .recordActivity(userId, "QUESTION_REPORTS_SUBMITTED", 0)
      .catch(() => undefined);

    return report;
  }

  async listMy(userId: string) {
    return this.prisma.questionReport.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        resolver: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      },
    });
  }

  async listAll(opts: { status?: string; questionId?: string } = {}) {
    return this.prisma.questionReport.findMany({
      where: {
        ...(opts.status ? { status: opts.status as any } : {}),
        ...(opts.questionId ? { questionId: opts.questionId } : {}),
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        resolver: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.questionReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        resolver: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      },
    });
    if (!report) throw new NotFoundException("Report not found");
    return report;
  }

  async update(staffId: string, id: string, dto: UpdateQuestionReportDto) {
    const existing = await this.prisma.questionReport.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Report not found");

    const data: any = {
      reason: dto.reason,
      details: dto.details,
      questionId: dto.questionId,
    };
    if (dto.status) {
      data.status = dto.status;
      data.resolverId = staffId;
      if (["RESOLVED", "ACCEPTED", "REJECTED"].includes(dto.status)) {
        data.resolvedAt = new Date();
      }
    }
    if (dto.resolution !== undefined) data.resolution = dto.resolution;

    const updated = await this.prisma.questionReport.update({
      where: { id },
      data,
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        resolver: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      },
    });

    if (
      dto.status &&
      dto.status !== existing.status &&
      existing.reporterId !== staffId
    ) {
      this.notifications.emit({
        userId: existing.reporterId,
        type: "QUESTION_REPORT_UPDATE",
        title: `Your report was ${dto.status.toLowerCase()}`,
        message:
          dto.resolution?.slice(0, 120) ?? `Status updated to ${dto.status}.`,
        data: { reportId: id, questionId: existing.questionId },
      });
    }

    return updated;
  }
}
