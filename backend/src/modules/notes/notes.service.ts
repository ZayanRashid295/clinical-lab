import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateNoteDto,
  QueryNotesDto,
  UpdateNoteDto,
} from "./dto/note.dto";
import { AchievementsService } from "../achievements/achievements.service";
import { GoalsService } from "../goals/goals.service";

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private achievements: AchievementsService,
    private goals: GoalsService
  ) {}

  async list(userId: string, q: QueryNotesDto) {
    const where: any = { userId };
    if (q.search) {
      where.OR = [
        { title: { contains: q.search } },
        { body: { contains: q.search } },
      ];
    }
    for (const k of [
      "systemId",
      "topicId",
      "subtopicId",
      "questionId",
    ] as const) {
      if (q[k]) where[k] = q[k];
    }
    if (q.pinned === "true") where.pinned = true;
    if (q.pinned === "false") where.pinned = false;

    return this.prisma.studentNote.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });
  }

  async stats(userId: string) {
    const [total, pinned, recent] = await Promise.all([
      this.prisma.studentNote.count({ where: { userId } }),
      this.prisma.studentNote.count({ where: { userId, pinned: true } }),
      this.prisma.studentNote.count({
        where: {
          userId,
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
        },
      }),
    ]);
    return { total, pinned, recent };
  }

  async create(userId: string, dto: CreateNoteDto) {
    const created = await this.prisma.studentNote.create({
      data: {
        userId,
        title: dto.title,
        body: dto.body,
        color: dto.color,
        pinned: dto.pinned ?? false,
        tags: dto.tags ? (dto.tags as any) : undefined,
        questionId: dto.questionId,
        topicId: dto.topicId,
        subtopicId: dto.subtopicId,
        systemId: dto.systemId,
        productId: dto.productId,
      },
    });

    void this.achievements
      .recordActivity(userId, "NOTES_CREATED", 1)
      .catch(() => undefined);
    void this.goals
      .recordProgress(userId, "NOTES_CREATED", 1)
      .catch(() => undefined);

    return created;
  }

  async findOne(userId: string, id: string) {
    const row = await this.prisma.studentNote.findUnique({ where: { id } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException("Note not found");
    }
    return row;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    await this.findOne(userId, id);
    return this.prisma.studentNote.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        color: dto.color,
        pinned: dto.pinned,
        tags: dto.tags ? (dto.tags as any) : undefined,
        questionId: dto.questionId,
        topicId: dto.topicId,
        subtopicId: dto.subtopicId,
        systemId: dto.systemId,
        productId: dto.productId,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.studentNote.delete({ where: { id } });
    return { ok: true };
  }
}
