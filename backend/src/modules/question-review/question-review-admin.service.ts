import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { UpdateQaIssueDto } from "./dto/update-qa-issue.dto";
import { CreateQaIssueCommentDto } from "./dto/create-qa-issue-comment.dto";
import { SaveQuestionQaDraftDto } from "./dto/save-question-qa-draft.dto";
import { ApproveQuestionQaDto } from "./dto/approve-question-qa.dto";

type InboxFilters = {
  system?: string;
  topic?: string;
  reviewer?: string;
  category?: string;
  severity?: string;
  status?: string;
  assignedToId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  questionId?: string;
};

@Injectable()
export class QuestionReviewAdminService {
  constructor(private prisma: PrismaService) {}

  async syncIssuesFromAnnotations() {
    const overallReviews = await this.syncOverallReviewAnnotations();
    const issues = await this.prisma.qaIssue.findMany({
      select: { annotationId: true, sourceAnnotationIds: true },
    });
    const linked = new Set<string>();
    for (const issue of issues) {
      if (issue.annotationId) linked.add(issue.annotationId);
      if (Array.isArray(issue.sourceAnnotationIds)) {
        for (const id of issue.sourceAnnotationIds as string[]) linked.add(id);
      }
    }

    const annotations = await this.prisma.questionReviewAnnotation.findMany({
      where: linked.size ? { id: { notIn: [...linked] } } : undefined,
      include: {
        response: {
          include: {
            attempt: { select: { reviewerName: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    let created = 0;
    let merged = 0;
    let updated = 0;
    for (const annotation of annotations) {
      const result = await this.upsertIssueFromAnnotation(annotation);
      if (result === "created") created++;
      if (result === "merged") merged++;
      if (result === "updated") updated++;
    }
    return {
      created: created + overallReviews.created,
      merged,
      updated: updated + overallReviews.updated,
      scanned: annotations.length + overallReviews.scanned,
    };
  }

  /**
   * Overall review comments are feedback too, but historically only inline
   * annotations were promoted to the admin inbox. Mirror each saved overall
   * review into a stable annotation so it uses the same QA issue workflow.
   */
  private async syncOverallReviewAnnotations() {
    const responses = await this.prisma.questionReviewResponse.findMany({
      where: {
        overallComment: { not: null },
      },
      include: {
        attempt: { select: { reviewerName: true } },
        annotations: {
          where: { targetType: "OVERALL" },
          select: { id: true, targetKey: true, body: true, severity: true },
        },
      },
    });

    let created = 0;
    let updated = 0;
    let scanned = 0;

    for (const response of responses) {
      const body = response.overallComment?.trim();
      if (!body) continue;
      scanned++;

      const targetKey = `overall-review:${response.id}`;
      const severity = response.approvalStatus === "REJECT" ? "MAJOR" : "MINOR";
      const existing = response.annotations.find((a) => a.targetKey === targetKey);
      const annotation = existing
        ? existing.body === body && existing.severity === severity
          ? await this.prisma.questionReviewAnnotation.findUniqueOrThrow({
              where: { id: existing.id },
            })
          : await this.prisma.questionReviewAnnotation.update({
              where: { id: existing.id },
              data: {
                body,
                severity,
                tags: ["Overall review"],
                section: "Overall review",
              },
            })
        : await this.prisma.questionReviewAnnotation.create({
            data: {
              responseId: response.id,
              targetType: "OVERALL",
              targetKey,
              section: "Overall review",
              body,
              tags: ["Overall review"],
              severity,
            },
          });

      const result = await this.upsertIssueFromAnnotation({
        ...annotation,
        response: {
          questionId: response.questionId,
          attempt: { reviewerName: response.attempt.reviewerName },
        },
      });
      if (result === "created") created++;
      if (result === "updated") updated++;
    }

    return { created, updated, scanned };
  }

  async upsertIssueFromAnnotation(annotation: {
    id: string;
    targetType: string;
    targetKey: string;
    section: string;
    selectedText: string | null;
    body: string;
    tags: unknown;
    severity: string;
    response: { questionId: string; attempt: { reviewerName: string } };
  }) {
    const questionId = annotation.response.questionId;
    const tags = Array.isArray(annotation.tags) ? (annotation.tags as string[]) : [];
    const category = tags[0] ?? "General";
    const reporterName = annotation.response.attempt.reviewerName;
    const title = annotation.body.trim().slice(0, 120) || "Reviewer feedback";

    const issueForAnnotation = await this.prisma.qaIssue.findUnique({
      where: { annotationId: annotation.id },
    });
    if (issueForAnnotation) {
      const names = new Set([
        ...(Array.isArray(issueForAnnotation.reporterNames)
          ? (issueForAnnotation.reporterNames as string[])
          : []),
        reporterName,
      ]);
      const reporterNames = [...names];
      const currentNames = Array.isArray(issueForAnnotation.reporterNames)
        ? (issueForAnnotation.reporterNames as string[])
        : [];
      const changed =
        issueForAnnotation.title !== title ||
        issueForAnnotation.body !== annotation.body ||
        issueForAnnotation.selectedText !== annotation.selectedText ||
        issueForAnnotation.category !== category ||
        issueForAnnotation.severity !== annotation.severity ||
        reporterNames.some((name) => !currentNames.includes(name));
      if (changed) {
        await this.prisma.qaIssue.update({
          where: { id: issueForAnnotation.id },
          data: {
            title,
            body: annotation.body,
            selectedText: annotation.selectedText,
            category,
            severity: annotation.severity as any,
            reporterNames,
          },
        });
      }
      return "updated" as const;
    }

    const existing = await this.prisma.qaIssue.findFirst({
      where: {
        questionId,
        targetKey: annotation.targetKey,
        category,
        status: { notIn: ["CLOSED", "REJECTED"] },
      },
    });

    if (existing) {
      const names = new Set([
        ...(Array.isArray(existing.reporterNames) ? (existing.reporterNames as string[]) : []),
        reporterName,
      ]);
      const ids = new Set([
        ...(Array.isArray(existing.sourceAnnotationIds)
          ? (existing.sourceAnnotationIds as string[])
          : []),
        annotation.id,
      ]);
      const severityRank = { MINOR: 1, MAJOR: 2, CRITICAL: 3 };
      const newSeverity =
        severityRank[annotation.severity as keyof typeof severityRank] >
        severityRank[existing.severity as keyof typeof severityRank]
          ? annotation.severity
          : existing.severity;

      await this.prisma.qaIssue.update({
        where: { id: existing.id },
        data: {
          reporterNames: [...names],
          sourceAnnotationIds: [...ids],
          severity: newSeverity as any,
          selectedText: existing.selectedText || annotation.selectedText,
        },
      });

      await this.logActivity({
        issueId: existing.id,
        questionId,
        actorName: reporterName,
        action: "issue_report_merged",
        meta: { annotationId: annotation.id },
      });

      return "merged" as const;
    }

    const issue = await this.prisma.qaIssue.create({
      data: {
        questionId,
        annotationId: annotation.id,
        targetType: annotation.targetType as any,
        targetKey: annotation.targetKey,
        section: annotation.section,
        category,
        severity: annotation.severity as any,
        title,
        body: annotation.body,
        selectedText: annotation.selectedText,
        currentContent: annotation.selectedText,
        reporterNames: [reporterName],
        sourceAnnotationIds: [annotation.id],
      },
    });

    await this.logActivity({
      issueId: issue.id,
      questionId,
      actorName: reporterName,
      action: "issue_created",
      meta: { annotationId: annotation.id, category },
    });

    return "created" as const;
  }

  async getDashboard() {
    await this.syncIssuesFromAnnotations();

    const [
      bundleQuestionIds,
      responses,
      openIssues,
      criticalIssues,
      resolvedIssues,
      approvedRecords,
      needsRevision,
      reviewers,
      issuesBySystem,
      issuesByTopic,
      issuesByCategory,
      severityDist,
      reviewerActivity,
      resolutionTimes,
    ] = await Promise.all([
      this.prisma.questionReviewBundleItem.findMany({
        select: { questionId: true },
        distinct: ["questionId"],
      }),
      this.prisma.questionReviewResponse.findMany({
        select: {
          id: true,
          approvalStatus: true,
          questionQualityRating: true,
          attempt: { select: { reviewerName: true, status: true } },
        },
      }),
      this.prisma.qaIssue.count({
        where: {
          status: { notIn: ["RESOLVED", "VERIFIED", "CLOSED", "REJECTED"] },
        },
      }),
      this.prisma.qaIssue.count({
        where: { severity: "CRITICAL", status: { notIn: ["CLOSED", "REJECTED"] } },
      }),
      this.prisma.qaIssue.count({
        where: { status: { in: ["RESOLVED", "VERIFIED", "CLOSED"] } },
      }),
      this.prisma.questionQaRecord.count({ where: { productionStatus: "APPROVED" } }),
      this.prisma.questionQaRecord.count({ where: { productionStatus: "NEEDS_REVISION" } }),
      this.prisma.questionReviewAttempt.findMany({
        select: { reviewerName: true },
        distinct: ["reviewerName"],
      }),
      this.groupIssuesByQuestionField("system"),
      this.groupIssuesByQuestionField("topic"),
      this.groupIssuesByField("category"),
      this.groupIssuesByField("severity"),
      this.getReviewerActivity(),
      this.getAverageResolutionHours(),
    ]);

    const totalQuestions = bundleQuestionIds.length;
    const reviewedResponses = responses.filter(
      (r) => r.approvalStatus && r.attempt.status === "COMPLETED"
    );
    const ratings = reviewedResponses
      .map((r) => r.questionQualityRating)
      .filter((v): v is number => typeof v === "number");
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

    const pendingReviews = Math.max(
      0,
      totalQuestions - new Set(reviewedResponses.map((r) => r.id)).size
    );

    return {
      cards: {
        totalQuestions,
        questionsReviewed: reviewedResponses.length,
        pendingReviews,
        openIssues,
        criticalIssues,
        resolvedIssues,
        questionsApproved: approvedRecords,
        questionsRequiringRevision: needsRevision,
        activeReviewers: reviewers.length,
        averageQuestionRating: avgRating,
      },
      charts: {
        mostReportedSystems: issuesBySystem,
        mostReportedTopics: issuesByTopic,
        issueCategories: issuesByCategory,
        severityDistribution: severityDist,
        reviewerActivity,
        averageResolutionHours: resolutionTimes,
      },
      insights: this.buildInsights({
        openIssues,
        criticalIssues,
        needsRevision,
        issuesBySystem,
        issuesByCategory,
      }),
    };
  }

  async listInbox(filters: InboxFilters) {
    await this.syncIssuesFromAnnotations();

    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;
    if (filters.category) where.category = filters.category;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.questionId) where.questionId = filters.questionId;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      };
    }

    const issues = await this.prisma.qaIssue.findMany({
      where,
      include: {
        question: {
          select: {
            id: true,
            title: true,
            system: { select: { name: true } },
            topic: { select: { name: true } },
          },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: this.inboxOrderBy(filters.sort),
      take: 200,
    });

    let filtered = issues;
    if (filters.system) {
      filtered = filtered.filter((i) => i.question.system?.name === filters.system);
    }
    if (filters.topic) {
      filtered = filtered.filter((i) => i.question.topic?.name === filters.topic);
    }
    if (filters.reviewer) {
      filtered = filtered.filter((i) => {
        const names = Array.isArray(i.reporterNames)
          ? (i.reporterNames as string[])
          : [];
        return names.includes(filters.reviewer!);
      });
    }

    return filtered.map((issue) => this.mapIssueCard(issue));
  }

  async getIssue(issueId: string) {
    const issue = await this.prisma.qaIssue.findUnique({
      where: { id: issueId },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            system: { select: { name: true } },
            topic: { select: { name: true } },
          },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        comments: { orderBy: { createdAt: "asc" } },
        activities: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!issue) throw new NotFoundException("Issue not found");
    return issue;
  }

  async updateIssue(
    issueId: string,
    dto: UpdateQaIssueDto,
    actor: { id: string; name: string }
  ) {
    const issue = await this.prisma.qaIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundException("Issue not found");

    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (["RESOLVED", "VERIFIED", "CLOSED"].includes(dto.status)) {
        data.resolvedAt = new Date();
      }
    }
    if (dto.assignedToId !== undefined) {
      data.assignedToId = dto.assignedToId;
      if (dto.assignedToId && !dto.status) data.status = "ASSIGNED";
    }
    if (dto.suggestedRevision !== undefined) data.suggestedRevision = dto.suggestedRevision;
    if (dto.currentContent !== undefined) data.currentContent = dto.currentContent;

    const updated = await this.prisma.qaIssue.update({
      where: { id: issueId },
      data,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.logActivity({
      issueId,
      questionId: issue.questionId,
      actorId: actor.id,
      actorName: actor.name,
      action: "issue_updated",
      meta: { changes: dto },
    });

    return updated;
  }

  async addIssueComment(
    issueId: string,
    dto: CreateQaIssueCommentDto,
    actor: { id: string; name: string }
  ) {
    const issue = await this.prisma.qaIssue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundException("Issue not found");

    const comment = await this.prisma.qaIssueComment.create({
      data: {
        issueId,
        authorId: actor.id,
        authorName: actor.name,
        body: dto.body.trim(),
        isInternal: dto.isInternal ?? false,
      },
    });

    await this.prisma.qaIssue.update({
      where: { id: issueId },
      data: { replyCount: { increment: 1 } },
    });

    await this.logActivity({
      issueId,
      questionId: issue.questionId,
      actorId: actor.id,
      actorName: actor.name,
      action: dto.isInternal ? "internal_note_added" : "discussion_reply",
      meta: { commentId: comment.id },
    });

    return comment;
  }

  async getQuestionReview(questionId: string) {
    await this.syncIssuesFromAnnotations();

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
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
        qaRecord: true,
        qaVersions: { orderBy: { version: "desc" }, take: 20 },
      },
    });
    if (!question) throw new NotFoundException("Question not found");

    const issues = await this.prisma.qaIssue.findMany({
      where: { questionId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        comments: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });

    const activities = await this.prisma.qaIssueActivity.findMany({
      where: { questionId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const responses = await this.prisma.questionReviewResponse.findMany({
      where: { questionId },
      include: {
        attempt: {
          select: { id: true, reviewerName: true, reviewerEmail: true, completedAt: true },
        },
        annotations: { orderBy: { createdAt: "asc" } },
      },
    });

    const heatmap = this.buildHeatmap(issues);
    const mappedQuestion = this.mapQuestionForReview(question, 0);

    return {
      question: mappedQuestion,
      issues,
      activities,
      heatmap,
      qaRecord: question.qaRecord,
      versions: question.qaVersions,
      reviewerSummaries: this.summarizeReviewers(responses),
      reviewerBundles: this.buildReviewerBundles(responses),
      draftSnapshot:
        question.qaRecord?.draftSnapshot ??
        this.buildDraftSnapshot(mappedQuestion),
    };
  }

  async saveQuestionDraft(
    questionId: string,
    dto: SaveQuestionQaDraftDto,
    actor: { id: string; name: string }
  ) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException("Question not found");

    const record = await this.prisma.questionQaRecord.upsert({
      where: { questionId },
      create: {
        questionId,
        draftSnapshot: dto.draftSnapshot as object,
        productionStatus: "DRAFT",
      },
      update: { draftSnapshot: dto.draftSnapshot as object },
    });

    const lastVersion = await this.prisma.questionQaVersion.findFirst({
      where: { questionId },
      orderBy: { version: "desc" },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    const version = await this.prisma.questionQaVersion.create({
      data: {
        questionId,
        version: nextVersion,
        authorId: actor.id,
        summary: dto.summary ?? `Draft saved (v${nextVersion})`,
        snapshot: dto.draftSnapshot as object,
      },
    });

    await this.logActivity({
      questionId,
      actorId: actor.id,
      actorName: actor.name,
      action: "draft_saved",
      meta: { version: nextVersion },
    });

    return { record, version };
  }

  async approveQuestion(
    questionId: string,
    dto: ApproveQuestionQaDto,
    actor: { id: string; name: string }
  ) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException("Question not found");

    const record = await this.prisma.questionQaRecord.upsert({
      where: { questionId },
      create: {
        questionId,
        productionStatus: dto.productionStatus as any,
        ratings: (dto.ratings as object) ?? undefined,
        decisionNote: dto.decisionNote ?? null,
        approvedById: dto.productionStatus === "APPROVED" ? actor.id : null,
        approvedAt: dto.productionStatus === "APPROVED" ? new Date() : null,
      },
      update: {
        productionStatus: dto.productionStatus as any,
        ratings: (dto.ratings as object) ?? undefined,
        decisionNote: dto.decisionNote ?? null,
        approvedById: dto.productionStatus === "APPROVED" ? actor.id : null,
        approvedAt: dto.productionStatus === "APPROVED" ? new Date() : null,
      },
    });

    await this.logActivity({
      questionId,
      actorId: actor.id,
      actorName: actor.name,
      action: "qa_decision",
      meta: { status: dto.productionStatus, ratings: dto.ratings },
    });

    return record;
  }

  async listAssignees() {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        roles: {
          some: {
            role: { name: { in: ["ADMIN", "SUPERADMIN", "FACULTY"] } },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roles: { include: { role: { select: { name: true } } } },
      },
      orderBy: { firstName: "asc" },
      take: 100,
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      roles: u.roles.map((r) => r.role.name),
    }));
  }

  async getReviewerInsights() {
    const attempts = await this.prisma.questionReviewAttempt.findMany({
      include: {
        responses: {
          include: { annotations: true },
        },
      },
    });

    const byReviewer = new Map<
      string,
      {
        name: string;
        sessions: number;
        questionsReviewed: number;
        issuesSubmitted: number;
        approvals: number;
        categories: Record<string, number>;
      }
    >();

    for (const attempt of attempts) {
      const name = attempt.reviewerName;
      const row = byReviewer.get(name) ?? {
        name,
        sessions: 0,
        questionsReviewed: 0,
        issuesSubmitted: 0,
        approvals: 0,
        categories: {},
      };
      row.sessions++;
      for (const response of attempt.responses) {
        if (response.approvalStatus) row.questionsReviewed++;
        if (response.approvalStatus === "APPROVE") row.approvals++;
        for (const ann of response.annotations) {
          row.issuesSubmitted++;
          const tags = Array.isArray(ann.tags) ? (ann.tags as string[]) : [];
          const cat = tags[0] ?? "General";
          row.categories[cat] = (row.categories[cat] ?? 0) + 1;
        }
      }
      byReviewer.set(name, row);
    }

    return [...byReviewer.values()].map((r) => ({
      ...r,
      approvalRate:
        r.questionsReviewed > 0
          ? Math.round((r.approvals / r.questionsReviewed) * 100)
          : 0,
      topCategories: Object.entries(r.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    }));
  }

  async listFilterOptions() {
    const [systems, topics, categories, reviewers] = await Promise.all([
      this.prisma.system.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.topic.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
        take: 200,
      }),
      this.prisma.qaIssue.findMany({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ["category"],
      }),
      this.prisma.questionReviewAttempt.findMany({
        select: { reviewerName: true },
        distinct: ["reviewerName"],
        orderBy: { reviewerName: "asc" },
      }),
    ]);

    return {
      systems: systems.map((s) => s.name),
      topics: topics.map((t) => t.name),
      categories: categories.map((c) => c.category).filter(Boolean),
      reviewers: reviewers.map((r) => r.reviewerName),
    };
  }

  // ---------- helpers ----------

  private mapIssueCard(issue: any) {
    const reporters = Array.isArray(issue.reporterNames)
      ? (issue.reporterNames as string[])
      : [];
    return {
      id: issue.id,
      questionId: issue.questionId,
      questionTitle: issue.question.title,
      system: issue.question.system?.name ?? null,
      topic: issue.question.topic?.name ?? null,
      category: issue.category,
      severity: issue.severity,
      status: issue.status,
      title: issue.title,
      body: issue.body,
      section: issue.section,
      targetType: issue.targetType,
      targetKey: issue.targetKey,
      reporters,
      reporterCount: reporters.length,
      assignedTo: issue.assignedTo
        ? {
            id: issue.assignedTo.id,
            name: `${issue.assignedTo.firstName} ${issue.assignedTo.lastName}`.trim(),
          }
        : null,
      replyCount: issue.replyCount,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  }

  private inboxOrderBy(sort?: string) {
    switch (sort) {
      case "oldest":
        return { createdAt: "asc" as const };
      case "critical":
        return [{ severity: "desc" as const }, { createdAt: "desc" as const }];
      case "commented":
        return { replyCount: "desc" as const };
      case "updated":
        return { updatedAt: "desc" as const };
      default:
        return { createdAt: "desc" as const };
    }
  }

  private async groupIssuesByField(field: "category" | "severity") {
    const where =
      field === "category" ? { category: { not: null as string | null } } : {};
    const issues = await this.prisma.qaIssue.groupBy({
      by: [field],
      where,
      _count: { _all: true },
    });
    return issues
      .map((row) => ({
        name: String(row[field] ?? "Unknown"),
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async groupIssuesByQuestionField(relation: "system" | "topic") {
    const issues = await this.prisma.qaIssue.findMany({
      include: {
        question: {
          select: {
            system: { select: { name: true } },
            topic: { select: { name: true } },
          },
        },
      },
    });
    const counts = new Map<string, number>();
    for (const issue of issues) {
      const name =
        relation === "system"
          ? issue.question.system?.name ?? "Unknown"
          : issue.question.topic?.name ?? "Unknown";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }

  private async getReviewerActivity() {
    const attempts = await this.prisma.questionReviewAttempt.findMany({
      select: {
        reviewerName: true,
        startedAt: true,
        completedAt: true,
        status: true,
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    });
    const counts = new Map<string, number>();
    for (const a of attempts) {
      counts.set(a.reviewerName, (counts.get(a.reviewerName) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }

  private async getAverageResolutionHours() {
    const resolved = await this.prisma.qaIssue.findMany({
      where: { resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 100,
    });
    if (!resolved.length) return null;
    const hours =
      resolved.reduce((sum, row) => {
        const ms = row.resolvedAt!.getTime() - row.createdAt.getTime();
        return sum + ms / (1000 * 60 * 60);
      }, 0) / resolved.length;
    return Math.round(hours * 10) / 10;
  }

  private buildInsights(input: {
    openIssues: number;
    criticalIssues: number;
    needsRevision: number;
    issuesBySystem: { name: string; count: number }[];
    issuesByCategory: { name: string; count: number }[];
  }) {
    const insights: string[] = [];
    if (input.criticalIssues > 0) {
      insights.push(
        `${input.criticalIssues} critical issue(s) need immediate medical review.`
      );
    }
    if (input.openIssues > 10) {
      insights.push(
        `Inbox has ${input.openIssues} open issues — prioritize by severity and system.`
      );
    }
    const topSystem = input.issuesBySystem[0];
    if (topSystem && topSystem.count >= 3) {
      insights.push(
        `${topSystem.name} has the most reported issues (${topSystem.count}).`
      );
    }
    const topCategory = input.issuesByCategory[0];
    if (topCategory) {
      insights.push(`Most common issue type: ${topCategory.name}.`);
    }
    if (input.needsRevision > 0) {
      insights.push(
        `${input.needsRevision} question(s) flagged as needing revision before publication.`
      );
    }
    return insights;
  }

  private buildHeatmap(issues: { targetType: string; targetKey: string; severity: string; section?: string }[]) {
    const sections = new Map<string, { count: number; maxSeverity: string }>();
    const rank = { MINOR: 1, MAJOR: 2, CRITICAL: 3 };

    for (const issue of issues) {
      const key = issue.section || issue.targetType;
      const existing = sections.get(key) ?? { count: 0, maxSeverity: "MINOR" };
      existing.count++;
      if (
        rank[issue.severity as keyof typeof rank] >
        rank[existing.maxSeverity as keyof typeof rank]
      ) {
        existing.maxSeverity = issue.severity;
      }
      sections.set(key, existing);
    }

    return [...sections.entries()].map(([section, data]) => ({
      section,
      count: data.count,
      level:
        data.count === 0
          ? "none"
          : data.maxSeverity === "CRITICAL" || data.count >= 4
            ? "high"
            : data.count >= 2
              ? "medium"
              : "low",
    }));
  }

  private summarizeReviewers(responses: any[]) {
    const map = new Map<string, { issues: number; completed: boolean }>();
    for (const r of responses) {
      const name = r.attempt.reviewerName;
      const row = map.get(name) ?? { issues: 0, completed: false };
      row.issues += r.annotations?.length ?? 0;
      row.completed = !!r.attempt.completedAt;
      map.set(name, row);
    }
    return [...map.entries()].map(([name, data]) => ({ name, ...data }));
  }

  /** All feedback from one reviewer on one question, grouped for admin review. */
  private buildReviewerBundles(responses: any[]) {
    return responses
      .filter(
        (r) =>
          (r.annotations?.length ?? 0) > 0 ||
          (r.overallComment && String(r.overallComment).trim())
      )
      .map((r) => ({
        attemptId: r.attemptId,
        reviewerName: r.attempt.reviewerName,
        reviewerEmail: r.attempt.reviewerEmail ?? null,
        completedAt: r.attempt.completedAt,
        overallComment: r.overallComment ?? null,
        approvalStatus: r.approvalStatus ?? null,
        questionQualityRating: r.questionQualityRating ?? null,
        explanationQualityRating: r.explanationQualityRating ?? null,
        imageQualityRating: r.imageQualityRating ?? null,
        difficultyRating: r.difficultyRating ?? null,
        annotations: (r.annotations ?? []).map((a: any) => ({
          id: a.id,
          targetType: a.targetType,
          targetKey: a.targetKey,
          section: a.section,
          selectedText: a.selectedText,
          body: a.body,
          tags: Array.isArray(a.tags) ? a.tags : [],
          severity: a.severity,
          createdAt: a.createdAt,
        })),
        feedbackCount: r.annotations?.length ?? 0,
      }))
      .sort((a, b) => b.feedbackCount - a.feedbackCount);
  }

  private buildDraftSnapshot(mappedQuestion: any) {
    return {
      stem: mappedQuestion.stem,
      title: mappedQuestion.title,
      options: mappedQuestion.options.map((o: any) => ({
        label: o.label,
        text: o.text,
        correct: o.correct,
      })),
      explanationText: JSON.stringify(mappedQuestion.explanation),
    };
  }

  private async logActivity(input: {
    issueId?: string;
    questionId?: string;
    actorId?: string;
    actorName: string;
    action: string;
    meta?: Record<string, unknown>;
  }) {
    await this.prisma.qaIssueActivity.create({
      data: {
        issueId: input.issueId,
        questionId: input.questionId,
        actorId: input.actorId,
        actorName: input.actorName,
        action: input.action,
        meta: (input.meta as object) ?? undefined,
      },
    });
  }

  private mapQuestionForReview(question: any, order: number) {
    const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const options = (question.choices ?? []).map((choice: any, index: number) => ({
      label: labels[index] ?? String(index + 1),
      value: labels[index] ?? String(index + 1),
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
        if (blocks.length) perAnswerExplanations[label] = blocks;
      }
    }

    return {
      order,
      id: question.id,
      stem: question.question,
      title: question.title,
      system: question.system?.name ?? null,
      topic: question.topic?.name ?? null,
      subtopic: question.subtopic?.name ?? null,
      questionStemBlocks: (question.questionStemBlocks ?? [])
        .map((block: any) => this.mapStemBlock(block))
        .filter(Boolean),
      options,
      explanation,
      perAnswerExplanations,
    };
  }

  private mapStemBlock(block: any) {
    if (!block) return null;
    const blockData = block.data ?? {};
    if (block.type === "TEXT") {
      return {
        id: block.id,
        type: "text",
        order: block.order ?? 0,
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
      return {
        id: block.id,
        type: "table",
        order: block.order ?? 0,
        data: blockData.tableHtml
          ? blockData
          : { ...blockData, tableHtml: blockData.html || blockData.tableHtml },
      };
    }
    if (block.type === "IMAGES") {
      return {
        id: block.id,
        type: "images",
        order: block.order ?? 0,
        data: blockData,
      };
    }
    return {
      id: block.id,
      type: String(block.type ?? "text").toLowerCase(),
      order: block.order ?? 0,
      data: blockData,
    };
  }

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
      return { id: block.id, type: "images", data: block.data ?? {} };
    }
    return { id: block.id, type: "text", data: block.data ?? {} };
  }
}
