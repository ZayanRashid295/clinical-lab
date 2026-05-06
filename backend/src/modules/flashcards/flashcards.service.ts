import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { FlashcardRating, FlashcardStatus } from "@prisma/client";
import {
  CreateFlashcardDto,
  QueryFlashcardsDto,
  ReviewFlashcardDto,
  UpdateFlashcardDto,
} from "./dto/flashcard.dto";
import { AchievementsService } from "../achievements/achievements.service";
import { GoalsService } from "../goals/goals.service";

/** Lightweight SM-2 inspired schedule. */
function nextSchedule(
  rating: FlashcardRating,
  prev: { intervalDays: number; easeFactor: number; repetitions: number }
) {
  let { intervalDays, easeFactor, repetitions } = prev;
  if (rating === "AGAIN") {
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * easeFactor);

    const delta =
      rating === "HARD" ? -0.15 : rating === "GOOD" ? 0 : 0.15;
    easeFactor = Math.max(1.3, easeFactor + delta);
  }
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + intervalDays);
  return { intervalDays, easeFactor, repetitions, dueAt };
}

@Injectable()
export class FlashcardsService {
  constructor(
    private prisma: PrismaService,
    private achievements: AchievementsService,
    private goals: GoalsService
  ) {}

  async list(userId: string, q: QueryFlashcardsDto) {
    const where: any = { userId };
    if (q.deck) where.deck = q.deck;
    if (q.search) where.OR = [
      { front: { contains: q.search } },
      { back: { contains: q.search } },
    ];
    if (q.due === "true") where.dueAt = { lte: new Date() };

    return this.prisma.flashcard.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
    });
  }

  async stats(userId: string) {
    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [total, due, mastered, reviewedToday, decks] = await Promise.all([
      this.prisma.flashcard.count({ where: { userId } }),
      this.prisma.flashcard.count({ where: { userId, dueAt: { lte: now } } }),
      this.prisma.flashcard.count({
        where: { userId, status: FlashcardStatus.MASTERED },
      }),
      this.prisma.flashcardReview.count({
        where: { userId, reviewedAt: { gte: start, lt: end } },
      }),
      this.prisma.flashcard.groupBy({
        by: ["deck"],
        where: { userId },
        _count: { _all: true },
      }),
    ]);

    return { total, due, mastered, reviewedToday, decks };
  }

  async create(userId: string, dto: CreateFlashcardDto) {
    return this.prisma.flashcard.create({
      data: {
        userId,
        deck: dto.deck ?? "General",
        front: dto.front,
        back: dto.back,
        hint: dto.hint,
        tags: dto.tags ? (dto.tags as any) : undefined,
        difficulty: dto.difficulty ?? "medium",
        questionId: dto.questionId,
        topicId: dto.topicId,
        subtopicId: dto.subtopicId,
        systemId: dto.systemId,
        productId: dto.productId,
      },
    });
  }

  async findOne(userId: string, id: string) {
    const row = await this.prisma.flashcard.findUnique({ where: { id } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException("Flashcard not found");
    }
    return row;
  }

  async update(userId: string, id: string, dto: UpdateFlashcardDto) {
    await this.findOne(userId, id);
    return this.prisma.flashcard.update({
      where: { id },
      data: {
        deck: dto.deck,
        front: dto.front,
        back: dto.back,
        hint: dto.hint,
        tags: dto.tags ? (dto.tags as any) : undefined,
        difficulty: dto.difficulty,
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
    await this.prisma.flashcard.delete({ where: { id } });
    return { ok: true };
  }

  async review(userId: string, id: string, dto: ReviewFlashcardDto) {
    const card = await this.findOne(userId, id);
    const next = nextSchedule(dto.rating, card);
    const status: FlashcardStatus =
      next.repetitions === 0
        ? FlashcardStatus.LEARNING
        : next.repetitions >= 5 && dto.rating === "EASY"
          ? FlashcardStatus.MASTERED
          : FlashcardStatus.REVIEW;

    const [updated] = await this.prisma.$transaction([
      this.prisma.flashcard.update({
        where: { id },
        data: {
          intervalDays: next.intervalDays,
          easeFactor: next.easeFactor,
          repetitions: next.repetitions,
          dueAt: next.dueAt,
          lastReviewedAt: new Date(),
          status,
        },
      }),
      this.prisma.flashcardReview.create({
        data: {
          flashcardId: id,
          userId,
          rating: dto.rating,
          intervalDays: next.intervalDays,
          easeFactor: next.easeFactor,
        },
      }),
    ]);

    void this.achievements
      .recordActivity(userId, "FLASHCARDS_REVIEWED", 1)
      .catch(() => undefined);
    void this.goals
      .recordProgress(userId, "FLASHCARDS_REVIEWED", 1)
      .catch(() => undefined);

    return updated;
  }
}
