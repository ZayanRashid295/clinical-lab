import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RealtimeBus } from "../realtime/realtime.bus";
import {
  CreateFeedbackDto,
  CreateFeedbackReplyDto,
  UpdateFeedbackDto,
} from "./dto/feedback.dto";

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private realtime: RealtimeBus
  ) {}

  async create(userId: string, dto: CreateFeedbackDto) {
    const ticket = await this.prisma.feedbackTicket.create({
      data: {
        userId,
        subject: dto.subject,
        body: dto.body,
        category: dto.category as any,
        priority: dto.priority as any,
        attachmentUrl: dto.attachmentUrl,
      },
    });

    // Fan out to all active staff so admins know a new ticket arrived
    void this.notifications
      .emitToRoles(
        ["SUPERADMIN", "ADMIN"],
        {
          type: "FEEDBACK_TICKET_CREATED",
          title: `New ${ticket.priority.toLowerCase()} ticket: ${ticket.category.toLowerCase()}`,
          message: ticket.subject.slice(0, 120),
          data: { ticketId: ticket.id, category: ticket.category },
        },
        userId
      )
      .catch(() => undefined);

    return ticket;
  }

  async listMy(userId: string) {
    return this.prisma.feedbackTicket.findMany({
      where: { userId },
      orderBy: { lastReplyAt: "desc" },
      take: 100,
    });
  }

  async listAll(opts: { status?: string } = {}) {
    return this.prisma.feedbackTicket.findMany({
      where: opts.status ? { status: opts.status as any } : {},
      orderBy: [{ priority: "desc" }, { lastReplyAt: "desc" }],
      take: 200,
    });
  }

  async findOne(userId: string, id: string, isStaff = false) {
    const ticket = await this.prisma.feedbackTicket.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (!isStaff && ticket.userId !== userId) {
      throw new ForbiddenException("Not yours");
    }
    return ticket;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateFeedbackDto,
    isStaff = false
  ) {
    const ticket = await this.prisma.feedbackTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (!isStaff && ticket.userId !== userId) {
      throw new ForbiddenException("Not yours");
    }
    const data: any = {
      subject: dto.subject,
      body: dto.body,
      category: dto.category,
      priority: dto.priority,
      attachmentUrl: dto.attachmentUrl,
    };
    if (isStaff) {
      data.status = dto.status;
      data.assigneeId = dto.assigneeId;
      if (dto.status === "RESOLVED" || dto.status === "CLOSED") {
        data.closedAt = new Date();
      }
    }
    const updated = await this.prisma.feedbackTicket.update({
      where: { id },
      data,
    });

    // Live-push the patch so anyone viewing the ticket sees the new status/priority
    this.realtime.emitToTicket(id, "ticket:updated", {
      ticketId: id,
      ticket: updated,
    });

    return updated;
  }

  async addReply(
    userId: string,
    id: string,
    dto: CreateFeedbackReplyDto,
    isStaff = false
  ) {
    const ticket = await this.prisma.feedbackTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (!isStaff && ticket.userId !== userId) {
      throw new ForbiddenException("Not yours");
    }
    const reply = await this.prisma.feedbackReply.create({
      data: {
        ticketId: id,
        authorId: userId,
        isStaff,
        body: dto.body,
        attachmentUrl: dto.attachmentUrl,
      },
    });
    await this.prisma.feedbackTicket.update({
      where: { id },
      data: {
        lastReplyAt: new Date(),
        status: isStaff ? "WAITING_USER" : "IN_PROGRESS",
      },
    });

    // Live-push the new reply to anyone viewing the ticket
    this.realtime.emitToTicket(id, "ticket:reply:created", {
      ticketId: id,
      reply,
    });

    // Notify the ticket owner if a staff member replied
    if (isStaff && ticket.userId !== userId) {
      this.notifications.emit({
        userId: ticket.userId,
        type: "FEEDBACK_REPLY",
        title: "Support replied to your ticket",
        message: ticket.subject.slice(0, 80),
        data: { ticketId: id, replyId: reply.id },
      });
    }

    // Notify staff when the user replies. If the ticket has an assignee,
    // notify just them; otherwise fan out to all admins so someone picks it up.
    if (!isStaff && ticket.userId === userId) {
      if (ticket.assigneeId) {
        void this.notifications.emit({
          userId: ticket.assigneeId,
          type: "FEEDBACK_USER_REPLY",
          title: "User replied on your ticket",
          message: ticket.subject.slice(0, 80),
          data: { ticketId: id, replyId: reply.id },
        });
      } else {
        void this.notifications
          .emitToRoles(
            ["SUPERADMIN", "ADMIN"],
            {
              type: "FEEDBACK_USER_REPLY",
              title: "User replied on a ticket",
              message: ticket.subject.slice(0, 80),
              data: { ticketId: id, replyId: reply.id },
            },
            userId
          )
          .catch(() => undefined);
      }
    }

    return reply;
  }
}
