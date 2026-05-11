import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AchievementsService } from "../achievements/achievements.service";
import { RealtimeBus } from "../realtime/realtime.bus";
import {
  CreateDiscussionDto,
  CreateReplyDto,
  QueryDiscussionDto,
  UpdateDiscussionDto,
  VoteDto,
} from "./dto/discussion.dto";

@Injectable()
export class DiscussionsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private achievements: AchievementsService,
    private realtime: RealtimeBus
  ) {}

  async create(authorId: string, dto: CreateDiscussionDto) {
    const created = await this.prisma.discussion.create({
      data: {
        ...dto,
        authorId,
      } as any,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      },
    });
    this.achievements
      .recordActivity(authorId, "DISCUSSION_POSTS" as any)
      .catch(() => undefined);

    // Light moderation signal: let staff/faculty know a new thread exists
    void this.notifications
      .emitToRoles(
        ["SUPERADMIN", "ADMIN", "FACULTY"],
        {
          type: "DISCUSSION_CREATED",
          title: "New discussion posted",
          message: created.title.slice(0, 120),
          data: { discussionId: created.id, context: created.context },
        },
        authorId
      )
      .catch(() => undefined);

    return created;
  }

  async list(params: QueryDiscussionDto) {
    const where: any = {};
    if (params.context) where.context = params.context;
    if (params.questionId) where.questionId = params.questionId;
    if (params.topicId) where.topicId = params.topicId;
    if (params.systemId) where.systemId = params.systemId;
    if (params.productId) where.productId = params.productId;
    if (params.authorId) where.authorId = params.authorId;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search } },
        { body: { contains: params.search } },
      ];
    }

    return this.prisma.discussion.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { lastActivityAt: "desc" }],
      take: 100,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
          },
        },
      },
    });
    if (!discussion) throw new NotFoundException("Discussion not found");
    return discussion;
  }

  async update(userId: string, id: string, dto: UpdateDiscussionDto) {
    const existing = await this.prisma.discussion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Discussion not found");
    if (existing.authorId !== userId) {
      throw new ForbiddenException("You can only edit your own discussions");
    }
    return this.prisma.discussion.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.discussion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Discussion not found");
    if (existing.authorId !== userId) {
      throw new ForbiddenException("You can only delete your own discussions");
    }
    await this.prisma.discussion.delete({ where: { id } });
    return { message: "Discussion deleted" };
  }

  async addReply(userId: string, discussionId: string, dto: CreateReplyDto) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });
    if (!discussion) throw new NotFoundException("Discussion not found");
    if (discussion.isClosed) {
      throw new ForbiddenException("Discussion is closed for replies");
    }

    const reply = await this.prisma.discussionReply.create({
      data: {
        discussionId,
        authorId: userId,
        body: dto.body,
        isAnswer: dto.isAnswer ?? false,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      },
    });

    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: {
        replyCount: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    if (discussion.authorId !== userId) {
      this.notifications.emit({
        userId: discussion.authorId,
        type: "DISCUSSION_REPLY",
        title: "New reply on your discussion",
        message: discussion.title.slice(0, 80),
        data: { discussionId, replyId: reply.id },
      });
    }

    // Push the new reply to anyone currently viewing this discussion
    this.realtime.emitToDiscussion(discussionId, "discussion:reply:created", {
      discussionId,
      reply,
      replyCount: discussion.replyCount + 1,
    });

    this.achievements
      .recordActivity(userId, "DISCUSSION_POSTS" as any)
      .catch(() => undefined);

    return reply;
  }

  async vote(userId: string, discussionId: string, dto: VoteDto) {
    const existing = await this.prisma.discussionVote.findFirst({
      where: { userId, discussionId, replyId: null },
    });

    let delta: number = dto.vote;
    const isFirstUpvote = !existing && dto.vote > 0;
    if (existing) {
      delta = dto.vote - existing.vote;
      await this.prisma.discussionVote.update({
        where: { id: existing.id },
        data: { vote: dto.vote },
      });
    } else {
      await this.prisma.discussionVote.create({
        data: { userId, discussionId, vote: dto.vote },
      });
    }

    if (delta !== 0) {
      const updated = await this.prisma.discussion.update({
        where: { id: discussionId },
        data: { upvotes: { increment: delta } },
        select: { upvotes: true },
      });
      this.realtime.emitToDiscussion(discussionId, "discussion:vote:changed", {
        discussionId,
        upvotes: updated.upvotes,
      });
    }

    // Notify the thread author the first time someone upvotes (avoids spam)
    if (isFirstUpvote) {
      const discussion = await this.prisma.discussion.findUnique({
        where: { id: discussionId },
        select: { authorId: true, title: true },
      });
      if (discussion && discussion.authorId !== userId) {
        void this.notifications.emit({
          userId: discussion.authorId,
          type: "DISCUSSION_UPVOTE",
          title: "Someone upvoted your discussion",
          message: discussion.title.slice(0, 100),
          data: { discussionId },
        });
      }
    }

    return { ok: true };
  }
}
