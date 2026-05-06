import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { BookmarkType } from "@prisma/client";
import { CreateBookmarkDto } from "./dto/bookmark.dto";

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBookmarkDto) {
    return this.prisma.bookmark.upsert({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType: dto.resourceType,
          resourceId: dto.resourceId,
        },
      },
      update: { note: dto.note },
      create: {
        userId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        note: dto.note,
      },
    });
  }

  async findForUser(userId: string, resourceType?: BookmarkType) {
    return this.prisma.bookmark.findMany({
      where: { userId, ...(resourceType ? { resourceType } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  async toggle(userId: string, dto: CreateBookmarkDto) {
    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType: dto.resourceType,
          resourceId: dto.resourceId,
        },
      },
    });
    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }
    await this.create(userId, dto);
    return { bookmarked: true };
  }

  async remove(userId: string, id: string) {
    const row = await this.prisma.bookmark.findUnique({ where: { id } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException("Bookmark not found");
    }
    await this.prisma.bookmark.delete({ where: { id } });
    return { ok: true };
  }
}
