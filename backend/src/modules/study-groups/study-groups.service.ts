import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RealtimeBus } from "../realtime/realtime.bus";
import { AchievementsService } from "../achievements/achievements.service";
import {
  CreateGroupPostDto,
  CreateStudyGroupDto,
  UpdateStudyGroupDto,
} from "./dto/study-group.dto";

function code(len = 8) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

@Injectable()
export class StudyGroupsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private realtime: RealtimeBus,
    private achievements: AchievementsService
  ) {}

  async create(ownerId: string, dto: CreateStudyGroupDto) {
    const inviteCode = dto.isPrivate ? code(8) : code(6);
    const group = await this.prisma.studyGroup.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
        category: dto.category ?? "General",
        icon: dto.icon ?? "users",
        color: dto.color ?? "emerald",
        isPrivate: dto.isPrivate ?? false,
        inviteCode,
      },
    });

    await this.prisma.studyGroupMember.create({
      data: {
        groupId: group.id,
        userId: ownerId,
        role: "OWNER",
      },
    });

    void this.achievements
      .recordActivity(ownerId, "STUDY_GROUPS_JOINED", 0)
      .catch(() => undefined);

    return group;
  }

  async list(opts: { mineOnly?: boolean; userId?: string } = {}) {
    if (opts.mineOnly && opts.userId) {
      const memberships = await this.prisma.studyGroupMember.findMany({
        where: { userId: opts.userId },
        include: { group: true },
        orderBy: { joinedAt: "desc" },
      });
      return memberships.map((m) => m.group);
    }
    return this.prisma.studyGroup.findMany({
      where: { isPrivate: false },
      orderBy: { memberCount: "desc" },
      take: 100,
    });
  }

  async findOne(userId: string, id: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        members: {
          orderBy: { joinedAt: "asc" },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
          },
        },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
          },
        },
      },
    });
    if (!group) throw new NotFoundException("Study group not found");
    if (group.isPrivate) {
      const member = group.members.find((m) => m.userId === userId);
      if (!member) {
        throw new ForbiddenException(
          "This is a private group. You need an invite to view it."
        );
      }
    }
    return group;
  }

  async update(userId: string, id: string, dto: UpdateStudyGroupDto) {
    const group = await this.prisma.studyGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException("Study group not found");
    if (group.ownerId !== userId)
      throw new ForbiddenException("Only the owner can edit this group");
    return this.prisma.studyGroup.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const group = await this.prisma.studyGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException("Study group not found");
    if (group.ownerId !== userId)
      throw new ForbiddenException("Only the owner can delete this group");
    await this.prisma.studyGroup.delete({ where: { id } });
    return { message: "Group deleted" };
  }

  async join(userId: string, id: string) {
    const group = await this.prisma.studyGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException("Study group not found");
    if (group.isPrivate) {
      throw new ForbiddenException("Use invite code to join this private group");
    }
    return this.addMember(group.id, userId);
  }

  async joinByCode(userId: string, inviteCode: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: { inviteCode },
    });
    if (!group) throw new NotFoundException("Invalid invite code");
    return this.addMember(group.id, userId);
  }

  private async addMember(groupId: string, userId: string) {
    const existing = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) return existing;
    const m = await this.prisma.studyGroupMember.create({
      data: { groupId, userId, role: "MEMBER" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      },
    });
    const group = await this.prisma.studyGroup.update({
      where: { id: groupId },
      data: { memberCount: { increment: 1 } },
    });

    // Notify the owner that someone joined (skip if owner joined their own group)
    if (group && group.ownerId !== userId) {
      void this.notifications.emit({
        userId: group.ownerId,
        type: "STUDY_GROUP_JOIN",
        title: `New member in ${group.name}`,
        message: `Your study group "${group.name}" just gained a new member.`,
        data: { groupId },
      });
    }

    // Push to anyone currently viewing the group so the member list refreshes live
    this.realtime.emitToGroup(groupId, "group:member:joined", {
      groupId,
      memberCount: group?.memberCount,
      member: m,
    });

    void this.achievements
      .recordActivity(userId, "STUDY_GROUPS_JOINED", 0)
      .catch(() => undefined);

    return m;
  }

  async transferOwnership(
    userId: string,
    id: string,
    newOwnerUserId: string
  ) {
    if (!newOwnerUserId?.trim()) {
      throw new BadRequestException("newOwnerUserId is required");
    }
    if (newOwnerUserId === userId) {
      throw new BadRequestException(
        "Choose another member — you are already the owner"
      );
    }

    const group = await this.prisma.studyGroup.findUnique({
      where: { id },
      include: { members: true },
    });
    if (!group) throw new NotFoundException("Study group not found");
    if (group.ownerId !== userId) {
      throw new ForbiddenException("Only the owner can transfer ownership");
    }

    const incoming = group.members.find((m) => m.userId === newOwnerUserId);
    if (!incoming) {
      throw new BadRequestException(
        "The new owner must already be a member of this group"
      );
    }

    const currentOwnerMember = group.members.find((m) => m.userId === userId);
    if (!currentOwnerMember) {
      throw new BadRequestException("Owner membership record is missing");
    }

    await this.prisma.$transaction([
      this.prisma.studyGroup.update({
        where: { id },
        data: { ownerId: newOwnerUserId },
      }),
      this.prisma.studyGroupMember.update({
        where: { id: currentOwnerMember.id },
        data: { role: "MEMBER" },
      }),
      this.prisma.studyGroupMember.update({
        where: { id: incoming.id },
        data: { role: "OWNER" },
      }),
    ]);

    this.realtime.emitToGroup(id, "group:ownership:transferred", {
      groupId: id,
      newOwnerId: newOwnerUserId,
      previousOwnerId: userId,
    });

    return this.findOne(userId, id);
  }

  async leave(userId: string, id: string) {
    const group = await this.prisma.studyGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException("Group not found");
    if (group.ownerId === userId) {
      throw new ForbiddenException(
        "Owner cannot leave the group; transfer ownership or delete instead"
      );
    }
    const m = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    if (!m) return { message: "Not a member" };
    await this.prisma.studyGroupMember.delete({ where: { id: m.id } });
    await this.prisma.studyGroup.update({
      where: { id },
      data: { memberCount: { decrement: 1 } },
    });
    return { message: "Left group" };
  }

  async createPost(userId: string, id: string, dto: CreateGroupPostDto) {
    const member = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    if (!member) {
      throw new ForbiddenException("You must join the group to post");
    }
    const post = await this.prisma.studyGroupPost.create({
      data: {
        groupId: id,
        authorId: userId,
        body: dto.body,
        attachmentUrl: dto.attachmentUrl,
        pinned: dto.pinned ?? false,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      },
    });

    void this.achievements
      .recordActivity(userId, "STUDY_GROUP_POSTS", 1)
      .catch(() => undefined);

    // Notify other members (in-app notification rows)
    const others = await this.prisma.studyGroupMember.findMany({
      where: { groupId: id, NOT: { userId } },
      take: 100,
    });
    const group = await this.prisma.studyGroup.findUnique({ where: { id } });
    for (const m of others) {
      this.notifications.emit({
        userId: m.userId,
        type: "STUDY_GROUP_POST",
        title: `New post in ${group?.name ?? "your study group"}`,
        message: dto.body.slice(0, 80),
        data: { groupId: id, postId: post.id },
      });
    }

    // Live-push the new post to anyone currently viewing the group
    this.realtime.emitToGroup(id, "group:post:created", {
      groupId: id,
      post,
    });

    return post;
  }

  async listPosts(userId: string, id: string) {
    const group = await this.findOne(userId, id);
    return group.posts;
  }
}
