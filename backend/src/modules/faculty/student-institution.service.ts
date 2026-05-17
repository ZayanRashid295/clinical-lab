import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ChatRole,
  FacultyAssignmentProgressStatus,
  NotificationType,
  StudentActivityType,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { InstitutionService } from "../institution/institution.service";

@Injectable()
export class StudentInstitutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly institution: InstitutionService,
    private readonly notifications: NotificationsService,
  ) {}

  private async requireMember(userId: string) {
    const member = await this.institution.getMemberForUser(userId);
    if (!member) return null;
    return member;
  }

  async getInstitutionContext(userId: string) {
    const member = await this.requireMember(userId);
    if (!member) {
      return { linked: false as const };
    }

    let primaryFaculty: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null = null;

    if (member.primaryFacultyUserId) {
      primaryFaculty = await this.prisma.user.findUnique({
        where: { id: member.primaryFacultyUserId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
    }

    return {
      linked: true as const,
      institution: member.institution,
      primaryFaculty,
      joinedAt: member.joinedAt,
    };
  }

  async listAssignments(userId: string) {
    const member = await this.requireMember(userId);
    if (!member) return [];

    return this.prisma.facultyAssignmentProgress.findMany({
      where: {
        studentUserId: userId,
        assignment: {
          institutionId: member.institutionId,
          status: "PUBLISHED",
        },
      },
      include: {
        assignment: {
          include: {
            items: {
              include: {
                institutionCase: true,
                institutionQuestionSet: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async listInstitutionCases(userId: string, mode?: string) {
    const member = await this.requireMember(userId);
    if (!member) return [];

    return this.prisma.institutionCase.findMany({
      where: {
        institutionId: member.institutionId,
        status: "PUBLISHED",
        ...(mode ? { mode: mode as any } : {}),
      },
      orderBy: { publishedAt: "desc" },
    });
  }

  async getInstitutionCase(userId: string, caseId: string) {
    const member = await this.requireMember(userId);
    if (!member) throw new ForbiddenException("Not linked to an institution");

    const row = await this.prisma.institutionCase.findFirst({
      where: {
        id: caseId,
        institutionId: member.institutionId,
        status: "PUBLISHED",
      },
    });
    if (!row) throw new NotFoundException("Institution case not found");
    return row;
  }

  async listInstitutionQuestions(userId: string) {
    const member = await this.requireMember(userId);
    if (!member) return [];

    return this.prisma.institutionQuestion.findMany({
      where: {
        institutionId: member.institutionId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listMessageThreads(userId: string) {
    const member = await this.requireMember(userId);
    if (!member) return [];

    const threads = await this.prisma.facultyStudentThread.findMany({
      where: { studentUserId: userId },
      include: {
        chatRoom: {
          include: {
            messages: { take: 1, orderBy: { createdAt: "desc" } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const facultyIds = threads.map((t) => t.facultyUserId);
    const facultyUsers = await this.prisma.user.findMany({
      where: { id: { in: facultyIds } },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
    });
    const byId = new Map(facultyUsers.map((f) => [f.id, f]));

    return threads.map((t) => ({
      id: t.id,
      faculty: byId.get(t.facultyUserId),
      lastMessage: t.chatRoom.messages[0] ?? null,
      chatRoomId: t.chatRoomId,
      updatedAt: t.updatedAt,
    }));
  }

  async getThreadMessages(studentUserId: string, threadId: string) {
    const member = await this.requireMember(studentUserId);
    if (!member) throw new ForbiddenException("Not linked to an institution");

    const thread = await this.prisma.facultyStudentThread.findFirst({
      where: { id: threadId, studentUserId },
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

    const faculty = await this.prisma.user.findUnique({
      where: { id: thread.facultyUserId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return { thread, faculty, messages };
  }

  async openThreadWithFaculty(studentUserId: string, facultyUserId: string) {
    const member = await this.requireMember(studentUserId);
    if (!member) throw new ForbiddenException("Not linked to an institution");

    const faculty = await this.prisma.facultyProfile.findFirst({
      where: {
        userId: facultyUserId,
        institutionId: member.institutionId,
        isActive: true,
      },
    });
    if (!faculty) throw new NotFoundException("Faculty not found");

    let thread = await this.prisma.facultyStudentThread.findUnique({
      where: {
        institutionId_facultyUserId_studentUserId: {
          institutionId: member.institutionId,
          facultyUserId,
          studentUserId,
        },
      },
    });

    if (!thread) {
      const room = await this.prisma.chatRoom.create({
        data: {
          name: "Faculty advisory",
          type: "FACULTY_STUDENT",
          participants: {
            create: [
              { userId: facultyUserId, role: ChatRole.ADMIN },
              { userId: studentUserId, role: ChatRole.MEMBER },
            ],
          },
        },
      });
      thread = await this.prisma.facultyStudentThread.create({
        data: {
          institutionId: member.institutionId,
          facultyUserId,
          studentUserId,
          chatRoomId: room.id,
        },
      });
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { chatRoomId: thread.chatRoomId, isDeleted: false },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    return { thread, messages };
  }

  async sendStudentMessage(
    studentUserId: string,
    threadId: string,
    content: string,
  ) {
    const member = await this.requireMember(studentUserId);
    if (!member) throw new ForbiddenException("Not linked to an institution");

    const thread = await this.prisma.facultyStudentThread.findFirst({
      where: { id: threadId, studentUserId },
    });
    if (!thread) throw new NotFoundException("Thread not found");

    const text = content.trim();
    if (!text) throw new BadRequestException("content is required");

    const message = await this.prisma.chatMessage.create({
      data: {
        chatRoomId: thread.chatRoomId,
        senderId: studentUserId,
        content: text.slice(0, 4000),
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

    const student = await this.prisma.user.findUnique({
      where: { id: studentUserId },
      select: { firstName: true, lastName: true },
    });

    const studentName = [student?.firstName, student?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    await this.notifications.emit({
      userId: thread.facultyUserId,
      type: NotificationType.FACULTY_MESSAGE,
      title: studentName ? `Message from ${studentName}` : "Message from student",
      message: text.slice(0, 120),
      data: { threadId, route: "/faculty/messages" },
    });

    await this.institution.recordActivity(
      studentUserId,
      StudentActivityType.MESSAGE_SENT,
      "Student sent a message to faculty",
      { threadId },
    );

    return message;
  }

  async markAssignmentProgress(
    studentUserId: string,
    assignmentId: string,
    status: FacultyAssignmentProgressStatus,
    extra?: { score?: number; conversationId?: string },
  ) {
    const member = await this.requireMember(studentUserId);
    if (!member) throw new ForbiddenException("Not linked to an institution");

    const progress = await this.prisma.facultyAssignmentProgress.findUnique({
      where: {
        assignmentId_studentUserId: {
          assignmentId,
          studentUserId,
        },
      },
      include: {
        assignment: {
          include: { items: true },
        },
      },
    });
    if (!progress) throw new NotFoundException("Assignment not found");
    if (progress.assignment.institutionId !== member.institutionId) {
      throw new ForbiddenException("Assignment not in your institution");
    }

    return this.prisma.facultyAssignmentProgress.update({
      where: { id: progress.id },
      data: {
        status,
        score: extra?.score ?? progress.score,
        conversationId: extra?.conversationId ?? progress.conversationId,
        completedAt:
          status === "SUBMITTED" || status === "GRADED"
            ? new Date()
            : progress.completedAt,
      },
    });
  }

  async updateAssignmentProgress(
    studentUserId: string,
    assignmentId: string,
    body: {
      status?: FacultyAssignmentProgressStatus;
      conversationId?: string;
      score?: number;
      institutionCaseId?: string;
    },
  ) {
    const member = await this.requireMember(studentUserId);
    if (!member) throw new ForbiddenException("Not linked to an institution");

    const progress = await this.prisma.facultyAssignmentProgress.findUnique({
      where: {
        assignmentId_studentUserId: {
          assignmentId,
          studentUserId,
        },
      },
      include: {
        assignment: {
          include: { items: true },
        },
      },
    });
    if (!progress) throw new NotFoundException("Assignment not found");
    if (progress.assignment.institutionId !== member.institutionId) {
      throw new ForbiddenException("Assignment not in your institution");
    }

    if (body.institutionCaseId) {
      const allowed = progress.assignment.items.some(
        (item) => item.institutionCaseId === body.institutionCaseId,
      );
      if (!allowed) {
        throw new BadRequestException(
          "Case is not part of this assignment",
        );
      }
    }

    const nextStatus =
      body.status ??
      (body.conversationId && progress.status === "NOT_STARTED"
        ? FacultyAssignmentProgressStatus.IN_PROGRESS
        : progress.status);

    return this.prisma.facultyAssignmentProgress.update({
      where: { id: progress.id },
      data: {
        status: nextStatus,
        conversationId: body.conversationId ?? progress.conversationId,
        score: body.score ?? progress.score,
        completedAt:
          nextStatus === "SUBMITTED" || nextStatus === "GRADED"
            ? new Date()
            : progress.completedAt,
      },
    });
  }

  async syncAssignmentFromMedprepSession(
    userId: string,
    session: {
      id: string;
      caseId?: string | null;
      status: string;
      score?: number | null;
      metadata?: unknown;
    },
  ) {
    const meta =
      session.metadata && typeof session.metadata === "object"
        ? (session.metadata as Record<string, unknown>)
        : null;
    const extra =
      meta?.extra && typeof meta.extra === "object"
        ? (meta.extra as Record<string, unknown>)
        : null;
    const assignmentId =
      (typeof meta?.assignmentId === "string" && meta.assignmentId) ||
      (typeof extra?.assignmentId === "string" && extra.assignmentId) ||
      null;
    if (!assignmentId) return null;

    const member = await this.requireMember(userId);
    if (!member) return null;

    if (session.status === "ACTIVE") {
      return this.updateAssignmentProgress(userId, assignmentId, {
        status: FacultyAssignmentProgressStatus.IN_PROGRESS,
        conversationId: session.id,
        institutionCaseId:
          typeof meta?.institutionCaseId === "string"
            ? meta.institutionCaseId
            : session.caseId ?? undefined,
      });
    }

    if (session.status === "COMPLETED") {
      await this.institution.recordActivity(
        userId,
        StudentActivityType.ASSIGNMENT_SUBMITTED,
        "Completed a faculty assignment case",
        {
          assignmentId,
          conversationId: session.id,
          caseId: session.caseId,
        },
      );
      return this.updateAssignmentProgress(userId, assignmentId, {
        status: FacultyAssignmentProgressStatus.SUBMITTED,
        conversationId: session.id,
        score: session.score ?? undefined,
        institutionCaseId:
          typeof meta?.institutionCaseId === "string"
            ? meta.institutionCaseId
            : session.caseId ?? undefined,
      });
    }

    return null;
  }
}
