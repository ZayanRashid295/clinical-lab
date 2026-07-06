import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { ACTIVITY_EVENTS } from "./activity-log.constants";
import { ActivityLogService } from "./activity-log.service";
import { buildQuestionPaperAuditSnapshot } from "../../common/utils/question-paper-audit.util";

export interface ActivityLogDetailField {
  label: string;
  value: string | number | boolean | null;
}

export interface ActivityLogDetailSection {
  id: string;
  title: string;
  fields?: ActivityLogDetailField[];
  testHistory?: {
    questionPaper: Record<string, unknown>;
    student: Record<string, unknown> | null;
    summary: Record<string, unknown>;
    questions: Array<Record<string, unknown>>;
  };
  items?: Array<Record<string, unknown>>;
}

export interface ActivityLogFullDetails {
  logId: string;
  detailType: string;
  title: string;
  sections: ActivityLogDetailSection[];
}

@Injectable()
export class ActivityLogDetailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async getFullDetails(logId: string): Promise<ActivityLogFullDetails> {
    const log = await this.activityLogService.findOne(logId);
    if (!log) {
      throw new NotFoundException(`Activity log ${logId} not found`);
    }

    const meta = (log.metadata ?? {}) as Record<string, unknown>;
    const sections: ActivityLogDetailSection[] = [];

    sections.push({
      id: "event",
      title: "Event record",
      fields: [
        { label: "Event", value: log.eventLabel },
        { label: "Component", value: log.componentLabel },
        { label: "Context", value: log.contextLabel ?? log.contextId },
        { label: "Context type", value: log.contextType },
        { label: "Context ID", value: log.contextId },
        { label: "Log ID", value: log.id },
      ],
    });

    sections.push({
      id: "network",
      title: "Network & device",
      fields: [
        { label: "IP address", value: log.ipAddress },
        {
          label: "IP (raw)",
          value: (meta.ipAddressRaw as string | undefined) ?? null,
        },
        {
          label: "X-Forwarded-For",
          value: (meta.ipForwardedFor as string | undefined) ?? null,
        },
        { label: "User agent", value: log.userAgent },
      ],
    });

    sections.push({
      id: "actors",
      title: "People involved",
      fields: [
        {
          label: "Performed by",
          value: log.userFullName
            ? `${log.userFullName}${log.userEmail ? ` (${log.userEmail})` : ""}`
            : "System",
        },
        {
          label: "Affected user",
          value: log.affectedUserFullName
            ? `${log.affectedUserFullName}${log.affectedUserEmail ? ` (${log.affectedUserEmail})` : ""}`
            : null,
        },
      ],
    });

    const assessmentEvents = new Set<string>([
      ACTIVITY_EVENTS.QUIZ_CREATED,
      ACTIVITY_EVENTS.QUIZ_STARTED,
      ACTIVITY_EVENTS.QUIZ_SUBMITTED,
      ACTIVITY_EVENTS.QUIZ_VIEWED,
    ]);

    if (
      log.component === "assessment" &&
      log.contextType === "question_paper" &&
      log.contextId &&
      assessmentEvents.has(log.eventName)
    ) {
      const snapshot =
        (meta.testHistory as Record<string, unknown> | undefined) ??
        (await this.getQuestionPaperAuditSnapshot(log.contextId));

      if (snapshot) {
        sections.push({
          id: "test-history",
          title: "Test history",
          testHistory: snapshot as ActivityLogDetailSection["testHistory"],
        });
      }
    }

    if (log.contextType === "question" && log.contextId) {
      const questionDetail = await this.buildQuestionDetail(log.contextId);
      if (questionDetail) {
        sections.push(questionDetail);
      }
    }

    if (log.eventName === ACTIVITY_EVENTS.QUESTION_REPORT_CREATED) {
      const reportSection = await this.buildQuestionReportDetail(
        meta,
        log.contextId,
      );
      if (reportSection) {
        sections.push(reportSection);
      }
    }

    if (log.component === "user" && (log.affectedUserId || log.contextId)) {
      const userSection = await this.buildUserDetail(
        log.affectedUserId ?? log.contextId ?? undefined,
      );
      if (userSection) {
        sections.push(userSection);
      }
    }

    if (log.component === "subscription" && log.contextId) {
      sections.push(await this.buildSubscriptionDetail(log.contextId, meta));
    }

    if (log.eventName === ACTIVITY_EVENTS.QUESTION_IMPORTED) {
      sections.push({
        id: "import",
        title: "Import summary",
        fields: [
          { label: "Files total", value: (meta.total as number) ?? null },
          { label: "Succeeded", value: (meta.succeeded as number) ?? null },
          { label: "Failed", value: (meta.failed as number) ?? null },
        ],
        items: Array.isArray(meta.files)
          ? (meta.files as Array<Record<string, unknown>>)
          : undefined,
      });
    }

    if (log.component === "auth") {
      sections.push({
        id: "auth",
        title: "Authentication details",
        fields: [
          { label: "Action", value: log.eventLabel },
          {
            label: "Account email",
            value: log.userEmail ?? log.affectedUserEmail,
          },
        ],
      });
    }

    const metaKeysUsed = new Set([
      "score",
      "correctAnswers",
      "totalQuestions",
      "testHistory",
      "ipAddressRaw",
      "ipForwardedFor",
      "reportId",
      "total",
      "succeeded",
      "failed",
      "files",
    ]);

    const extraMeta = Object.entries(meta).filter(
      ([key]) => !metaKeysUsed.has(key),
    );
    if (extraMeta.length > 0) {
      sections.push({
        id: "metadata",
        title: "Additional metadata",
        fields: extraMeta.map(([key, value]) => ({
          label: key.replace(/_/g, " "),
          value:
            typeof value === "object" && value !== null
              ? JSON.stringify(value)
              : (value as string | number | boolean | null),
        })),
      });
    }

    if (
      log.eventName === ACTIVITY_EVENTS.QUIZ_SUBMITTED &&
      meta.score != null
    ) {
      sections.unshift({
        id: "score-summary",
        title: "Score summary",
        fields: [
          { label: "Score", value: `${meta.score}%` },
          {
            label: "Correct",
            value: meta.correctAnswers as number | null,
          },
          {
            label: "Total questions",
            value: meta.totalQuestions as number | null,
          },
        ],
      });
    }

    return {
      logId: log.id,
      detailType: log.component,
      title: `${log.eventLabel} — full record`,
      sections,
    };
  }

  private async buildQuestionDetail(
    questionId: string,
  ): Promise<ActivityLogDetailSection | null> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        choices: { orderBy: { order: "asc" } },
        system: { select: { name: true } },
        topic: { select: { name: true } },
        subtopic: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!question) return null;

    const correct = question.choices.find((c) => c.isCorrect);

    return {
      id: "question",
      title: "Question details",
      fields: [
        { label: "Question ID", value: question.id },
        { label: "Title", value: question.title },
        { label: "Category", value: question.category?.name ?? null },
        { label: "System", value: question.system?.name ?? null },
        { label: "Topic", value: question.topic?.name ?? null },
        { label: "Subtopic", value: question.subtopic?.name ?? null },
        { label: "Difficulty", value: question.difficulty },
        { label: "Active", value: question.isActive },
        { label: "Correct answer", value: correct?.text ?? null },
        {
          label: "Stem preview",
          value: question.question.slice(0, 300),
        },
      ],
      items: question.choices.map((choice, idx) => ({
        label: String.fromCharCode(65 + idx),
        text: choice.text,
        isCorrect: choice.isCorrect,
      })),
    };
  }

  private async buildQuestionReportDetail(
    meta: Record<string, unknown>,
    questionId: string | null,
  ): Promise<ActivityLogDetailSection | null> {
    const reportId = meta.reportId as string | undefined;
    const report = reportId
      ? await this.prisma.questionReport.findUnique({
          where: { id: reportId },
          include: {
            reporter: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        })
      : null;

    return {
      id: "question-report",
      title: "Question report",
      fields: [
        { label: "Report ID", value: report?.id ?? reportId ?? null },
        { label: "Question ID", value: questionId },
        { label: "Reason", value: report?.reason ?? null },
        { label: "Status", value: report?.status ?? null },
        { label: "Details", value: report?.details ?? null },
        {
          label: "Reported by",
          value: report?.reporter
            ? `${report.reporter.firstName} ${report.reporter.lastName} (${report.reporter.email})`
            : null,
        },
      ],
    };
  }

  private async buildUserDetail(
    userId?: string,
  ): Promise<ActivityLogDetailSection | null> {
    if (!userId) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: { select: { name: true } } },
        },
      },
    });

    if (!user) return null;

    return {
      id: "user",
      title: "User account",
      fields: [
        { label: "User ID", value: user.id },
        { label: "Email", value: user.email },
        {
          label: "Name",
          value: `${user.firstName} ${user.lastName}`.trim(),
        },
        { label: "Phone", value: user.phone },
        { label: "Active", value: user.isActive },
        {
          label: "Roles",
          value: user.roles.map((ur) => ur.role.name).join(", ") || null,
        },
        {
          label: "Created",
          value: user.createdAt.toISOString(),
        },
      ],
    };
  }

  private async buildSubscriptionDetail(
    contextId: string,
    meta: Record<string, unknown>,
  ): Promise<ActivityLogDetailSection> {
    const subscription = await this.prisma.billingSubscription.findUnique({
      where: { id: contextId },
      include: {
        plan: { select: { name: true } },
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    return {
      id: "subscription",
      title: "Subscription details",
      fields: [
        { label: "Subscription ID", value: contextId },
        {
          label: "Plan",
          value: subscription?.plan?.name ?? null,
        },
        { label: "Status", value: subscription?.status ?? null },
        {
          label: "Subscriber",
          value: subscription?.user
            ? `${subscription.user.firstName} ${subscription.user.lastName} (${subscription.user.email})`
            : null,
        },
        {
          label: "Period start",
          value: subscription?.currentPeriodStart?.toISOString() ?? null,
        },
        {
          label: "Period end",
          value: subscription?.currentPeriodEnd?.toISOString() ?? null,
        },
        ...(Object.entries(meta).map(([key, value]) => ({
          label: key.replace(/_/g, " "),
          value:
            typeof value === "object" && value !== null
              ? JSON.stringify(value)
              : (value as string | number | boolean | null),
        })) as ActivityLogDetailField[]),
      ],
    };
  }

  private async getQuestionPaperAuditSnapshot(questionPaperId: string) {
    return buildQuestionPaperAuditSnapshot(this.prisma, questionPaperId);
  }
}
