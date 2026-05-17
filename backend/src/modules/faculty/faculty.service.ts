import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ChatRole,
  FacultyAssignmentProgressStatus,
  FacultyAssignmentStatus,
  InstitutionCaseStatus,
  Prisma,
  StudentActivityType,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  assignmentPublishedNotification,
  facultyMessageNotification,
} from "./faculty-notifications.util";
import { FacultyScope, FacultyScopeService } from "./faculty-scope.service";

@Injectable()
export class FacultyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: FacultyScopeService,
    private readonly notifications: NotificationsService,
  ) {}

  async getDashboard(userId: string) {
    const fac = await this.scope.requireFaculty(userId);
    const studentIds = await this.scope.studentIdsInScope(fac.institutionId);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeStudents,
      medprepCompleted,
      openAssignments,
      recentEvents,
      unreadThreads,
    ] = await Promise.all([
      this.prisma.studentActivityEvent.findMany({
        where: {
          institutionId: fac.institutionId,
          createdAt: { gte: weekAgo },
          userId: { in: studentIds },
        },
        distinct: ["userId"],
        select: { userId: true },
      }),
      this.prisma.medprepConversation.count({
        where: {
          userId: { in: studentIds },
          status: "COMPLETED",
          completedAt: { gte: weekAgo },
        },
      }),
      this.prisma.facultyAssignment.count({
        where: {
          institutionId: fac.institutionId,
          status: "PUBLISHED",
        },
      }),
      this.prisma.studentActivityEvent.findMany({
        where: { institutionId: fac.institutionId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.facultyStudentThread.count({
        where: { facultyUserId: userId },
      }),
    ]);

    return {
      institutionId: fac.institutionId,
      stats: {
        totalStudents: studentIds.length,
        activeStudents7d: activeStudents.length,
        medprepCompleted7d: medprepCompleted,
        openAssignments,
        messageThreads: unreadThreads,
      },
      recentActivity: recentEvents,
    };
  }

  async listStudents(userId: string, search?: string) {
    const fac = await this.scope.requireFaculty(userId);
    const members = await this.prisma.institutionMember.findMany({
      where: {
        institutionId: fac.institutionId,
        status: "ACTIVE",
        ...(search
          ? {
              user: {
                OR: [
                  { email: { contains: search } },
                  { firstName: { contains: search } },
                  { lastName: { contains: search } },
                ],
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const ids = members.map((m) => m.userId);
    const [sessions, papers] = await Promise.all([
      this.prisma.medprepConversation.groupBy({
        by: ["userId"],
        where: { userId: { in: ids }, status: "COMPLETED" },
        _count: { _all: true },
        _avg: { score: true },
      }),
      this.prisma.questionPaperQuestion.groupBy({
        by: ["questionPaperId"],
        where: {
          questionPaper: { userId: { in: ids } },
          userAnswer: { not: null },
        },
        _count: { _all: true },
      }),
    ]);

    const sessionByUser = new Map(
      sessions.map((s) => [
        s.userId,
        { count: s._count._all, avgScore: s._avg.score ?? 0 },
      ]),
    );

    return members.map((m) => ({
      ...m.user,
      primaryFacultyUserId: m.primaryFacultyUserId,
      joinedAt: m.joinedAt,
      medprepCasesCompleted: sessionByUser.get(m.userId)?.count ?? 0,
      avgMedprepScore: sessionByUser.get(m.userId)?.avgScore ?? null,
      qbankAttempts: papers.length,
    }));
  }

  async getStudentDetail(facultyUserId: string, studentUserId: string) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    await this.scope.assertStudentInScope(fac.institutionId, studentUserId);

    const [user, member, sessions, events, progress] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: studentUserId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
        },
      }),
      this.prisma.institutionMember.findUnique({
        where: { userId: studentUserId },
      }),
      this.prisma.medprepConversation.findMany({
        where: { userId: studentUserId },
        orderBy: { updatedAt: "desc" },
        take: 25,
        select: {
          id: true,
          mode: true,
          title: true,
          caseId: true,
          status: true,
          score: true,
          startedAt: true,
          completedAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.studentActivityEvent.findMany({
        where: { userId: studentUserId, institutionId: fac.institutionId },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      this.prisma.facultyAssignmentProgress.findMany({
        where: { studentUserId },
        include: {
          assignment: { select: { id: true, title: true, dueAt: true, status: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    if (!user) throw new NotFoundException("Student not found");

    return { user, member, sessions, events, assignmentProgress: progress };
  }

  async compareStudents(facultyUserId: string, studentIds: string[]) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    const unique = [...new Set(studentIds)].slice(0, 8);
    for (const sid of unique) {
      await this.scope.assertStudentInScope(fac.institutionId, sid);
    }

    const rows = await Promise.all(
      unique.map(async (sid) => {
        const user = await this.prisma.user.findUnique({
          where: { id: sid },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
        const agg = await this.prisma.medprepConversation.aggregate({
          where: { userId: sid, status: "COMPLETED" },
          _count: { _all: true },
          _avg: { score: true },
        });
        const hints = await this.prisma.medprepHintSession.aggregate({
          where: { userId: sid },
          _sum: { totalHintsUsed: true },
        });
        return {
          user,
          casesCompleted: agg._count._all,
          avgScore: agg._avg.score,
          totalHints: hints._sum.totalHintsUsed ?? 0,
        };
      }),
    );
    return { students: rows };
  }

  // ——— Assignments ———

  async listAssignments(facultyUserId: string) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    return this.prisma.facultyAssignment.findMany({
      where: { institutionId: fac.institutionId },
      include: {
        items: {
          include: {
            institutionCase: { select: { id: true, title: true, mode: true } },
            institutionQuestionSet: { select: { id: true, title: true } },
          },
        },
        _count: { select: { progress: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async createAssignment(facultyUserId: string, body: Record<string, unknown>) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    const title = String(body.title ?? "").trim();
    if (!title) throw new BadRequestException("title is required");

    return this.prisma.facultyAssignment.create({
      data: {
        institutionId: fac.institutionId,
        createdByFacultyId: facultyUserId,
        title,
        instructions: body.instructions ? String(body.instructions) : null,
        type: (body.type as any) ?? "MIXED",
        dueAt: body.dueAt ? new Date(String(body.dueAt)) : null,
        items: {
          create: Array.isArray(body.items)
            ? (body.items as any[]).map((item, i) => ({
                itemType: item.itemType ?? "CASE",
                medprepMode: item.medprepMode ?? null,
                institutionCaseId: item.institutionCaseId ?? null,
                institutionQuestionSetId: item.institutionQuestionSetId ?? null,
                sortOrder: i,
              }))
            : [],
        },
      },
      include: { items: true },
    });
  }

  async publishAssignment(facultyUserId: string, assignmentId: string) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    const assignment = await this.prisma.facultyAssignment.findFirst({
      where: { id: assignmentId, institutionId: fac.institutionId },
    });
    if (!assignment) throw new NotFoundException("Assignment not found");

    const studentIds = await this.scope.studentIdsInScope(fac.institutionId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const pub = await tx.facultyAssignment.update({
        where: { id: assignmentId },
        data: {
          status: FacultyAssignmentStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        include: { items: true },
      });

      for (const sid of studentIds) {
        await tx.facultyAssignmentProgress.upsert({
          where: {
            assignmentId_studentUserId: {
              assignmentId,
              studentUserId: sid,
            },
          },
          update: {},
          create: {
            assignmentId,
            studentUserId: sid,
            status: FacultyAssignmentProgressStatus.NOT_STARTED,
          },
        });
      }
      return pub;
    });

    await this.notifications.emitMany(
      studentIds,
      assignmentPublishedNotification({
        assignmentId,
        title: assignment.title,
        dueAt: updated.dueAt,
      }),
    );

    return updated;
  }

  // ——— Institution cases ———

  async listCases(facultyUserId: string, mode?: string) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    return this.prisma.institutionCase.findMany({
      where: {
        institutionId: fac.institutionId,
        ...(mode ? { mode: mode as any } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async createCase(facultyUserId: string, body: Record<string, unknown>) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    const title = String(body.title ?? "").trim();
    const disease = String(body.disease ?? "").trim();
    if (!title || !disease) {
      throw new BadRequestException("title and disease are required");
    }

    return this.prisma.institutionCase.create({
      data: {
        institutionId: fac.institutionId,
        createdByFacultyId: facultyUserId,
        mode: (body.mode as any) ?? "LEARNING",
        title,
        specialty: body.specialty ? String(body.specialty) : null,
        difficulty: body.difficulty ? String(body.difficulty) : "medium",
        disease,
        diseaseName: body.diseaseName ? String(body.diseaseName) : disease,
        symptoms: (body.symptoms ?? []) as Prisma.InputJsonValue,
        history: (body.history ?? []) as Prisma.InputJsonValue,
        labs: (body.labs ?? {}) as Prisma.InputJsonValue,
        patientProfile: (body.patientProfile ?? {}) as Prisma.InputJsonValue,
        learningObjectives: body.learningObjectives
          ? String(body.learningObjectives)
          : null,
        status: InstitutionCaseStatus.DRAFT,
      },
    });
  }

  async publishCase(facultyUserId: string, caseId: string) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    const row = await this.prisma.institutionCase.findFirst({
      where: { id: caseId, institutionId: fac.institutionId },
    });
    if (!row) throw new NotFoundException("Case not found");
    return this.prisma.institutionCase.update({
      where: { id: caseId },
      data: {
        status: InstitutionCaseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  // ——— Institution questions ———

  async listQuestions(facultyUserId: string) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    return this.prisma.institutionQuestion.findMany({
      where: { institutionId: fac.institutionId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createQuestion(facultyUserId: string, body: Record<string, unknown>) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    const question = String(body.question ?? "").trim();
    if (!question) throw new BadRequestException("question is required");
    const choices = body.choices;
    if (!Array.isArray(choices) || choices.length < 2) {
      throw new BadRequestException("choices array required (min 2)");
    }

    return this.prisma.institutionQuestion.create({
      data: {
        institutionId: fac.institutionId,
        createdByFacultyId: facultyUserId,
        setId: body.setId ? String(body.setId) : null,
        question,
        explanation: body.explanation ? String(body.explanation) : null,
        choices: choices as Prisma.InputJsonValue,
        difficulty: body.difficulty ? String(body.difficulty) : "medium",
        tags: body.tags ? (body.tags as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async listQuestionSets(facultyUserId: string) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    return this.prisma.institutionQuestionSet.findMany({
      where: { institutionId: fac.institutionId },
      include: { _count: { select: { questions: true } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async createQuestionSet(facultyUserId: string, body: Record<string, unknown>) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    const title = String(body.title ?? "").trim();
    if (!title) throw new BadRequestException("title is required");
    return this.prisma.institutionQuestionSet.create({
      data: {
        institutionId: fac.institutionId,
        createdByFacultyId: facultyUserId,
        title,
        description: body.description ? String(body.description) : null,
        isPublished: Boolean(body.isPublished),
      },
    });
  }

  // ——— Messaging ———

  async listThreads(facultyUserId: string) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    const threads = await this.prisma.facultyStudentThread.findMany({
      where: { facultyUserId },
      include: {
        chatRoom: {
          include: {
            messages: { take: 1, orderBy: { createdAt: "desc" } },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const studentIds = threads.map((t) => t.studentUserId);
    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
    });
    const byId = new Map(students.map((s) => [s.id, s]));

    return threads.map((t) => ({
      id: t.id,
      student: byId.get(t.studentUserId),
      lastMessage: t.chatRoom.messages[0] ?? null,
      chatRoomId: t.chatRoomId,
      updatedAt: t.updatedAt,
    }));
  }

  async getOrCreateThread(facultyUserId: string, studentUserId: string) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    await this.scope.assertStudentInScope(fac.institutionId, studentUserId);

    const existing = await this.prisma.facultyStudentThread.findUnique({
      where: {
        institutionId_facultyUserId_studentUserId: {
          institutionId: fac.institutionId,
          facultyUserId,
          studentUserId,
        },
      },
    });
    if (existing) return this.getThreadMessages(facultyUserId, existing.id);

    const room = await this.prisma.chatRoom.create({
      data: {
        name: `Faculty advisory`,
        type: "FACULTY_STUDENT",
        participants: {
          create: [
            { userId: facultyUserId, role: ChatRole.ADMIN },
            { userId: studentUserId, role: ChatRole.MEMBER },
          ],
        },
      },
    });

    const thread = await this.prisma.facultyStudentThread.create({
      data: {
        institutionId: fac.institutionId,
        facultyUserId,
        studentUserId,
        chatRoomId: room.id,
      },
    });

    return this.getThreadMessages(facultyUserId, thread.id);
  }

  async getThreadMessages(facultyUserId: string, threadId: string) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    const thread = await this.prisma.facultyStudentThread.findFirst({
      where: { id: threadId, facultyUserId },
    });
    if (!thread) throw new NotFoundException("Thread not found");

    const messages = await this.prisma.chatMessage.findMany({
      where: { chatRoomId: thread.chatRoomId, isDeleted: false },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    const student = await this.prisma.user.findUnique({
      where: { id: thread.studentUserId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return { thread, student, messages };
  }

  async sendMessage(
    facultyUserId: string,
    threadId: string,
    content: string,
    metadata?: Record<string, unknown>,
  ) {
    const fac = await this.scope.requireFaculty(facultyUserId);
    const thread = await this.prisma.facultyStudentThread.findFirst({
      where: { id: threadId, facultyUserId },
    });
    if (!thread) throw new NotFoundException("Thread not found");
    const text = content.trim();
    if (!text) throw new BadRequestException("content is required");

    const message = await this.prisma.chatMessage.create({
      data: {
        chatRoomId: thread.chatRoomId,
        senderId: facultyUserId,
        content: text.slice(0, 4000),
        metadata: metadata
          ? (metadata as Prisma.InputJsonValue)
          : undefined,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    await this.prisma.facultyStudentThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    const faculty = await this.prisma.user.findUnique({
      where: { id: facultyUserId },
      select: { firstName: true, lastName: true },
    });

    await this.notifications.emit({
      userId: thread.studentUserId,
      ...facultyMessageNotification({
        facultyUserId,
        facultyFirstName: faculty?.firstName,
        facultyLastName: faculty?.lastName,
        preview: text,
        threadId,
      }),
    });

    await this.prisma.studentActivityEvent.create({
      data: {
        institutionId: fac.institutionId,
        userId: facultyUserId,
        type: StudentActivityType.MESSAGE_SENT,
        summary: "Faculty sent a message",
        metadata: { threadId, studentUserId: thread.studentUserId },
      },
    });

    return message;
  }
}
