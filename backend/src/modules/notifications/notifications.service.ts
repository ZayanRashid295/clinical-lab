import { Injectable } from "@nestjs/common";
import { NotificationType, Prisma } from "@prisma/client";
import { Observable, Subject } from "rxjs";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RealtimeBus } from "../realtime/realtime.bus";

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, any>;
}

export interface NotificationStreamEvent {
  type: "notification" | "ping";
  data: any;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeBus
  ) {}

  /**
   * Per-user RxJS subject used by the SSE endpoint to push live
   * notifications to connected clients.
   */
  private streams = new Map<string, Subject<NotificationStreamEvent>>();

  private getStream(userId: string): Subject<NotificationStreamEvent> {
    let s = this.streams.get(userId);
    if (!s) {
      s = new Subject<NotificationStreamEvent>();
      this.streams.set(userId, s);
    }
    return s;
  }

  /**
   * Subscribe to live notifications for a user. Used by the SSE controller.
   * The returned observable emits every notification persisted via `create()`.
   */
  stream(userId: string): Observable<NotificationStreamEvent> {
    return this.getStream(userId).asObservable();
  }

  /**
   * Called from controller when an SSE connection closes so we don't
   * leak subjects for users that have disconnected.
   */
  releaseStreamIfIdle(userId: string): void {
    const s = this.streams.get(userId);
    if (s && (s as any).observers?.length === 0) {
      s.complete();
      this.streams.delete(userId);
    }
  }

  async create(createNotificationDto: CreateNotificationInput) {
    if (!createNotificationDto.userId) {
      throw new Error("User ID is required");
    }
    if (!createNotificationDto.title) {
      throw new Error("Title is required");
    }
    if (!createNotificationDto.message) {
      throw new Error("Message is required");
    }
    if (createNotificationDto.title.length > 100) {
      throw new Error("Title must be 100 characters or less");
    }
    if (createNotificationDto.message.length > 500) {
      throw new Error("Message must be 500 characters or less");
    }

    const created = await this.prisma.notification.create({
      data: {
        userId: createNotificationDto.userId,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        type: createNotificationDto.type ?? "GENERAL",
        data: (createNotificationDto.data as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // Push to any live SSE subscribers for this user
    const stream = this.streams.get(created.userId);
    if (stream) {
      stream.next({ type: "notification", data: created });
    }

    // Push to any live socket.io subscribers for this user
    this.realtime.emitToUser(created.userId, "notification", created);

    return created;
  }

  /**
   * Convenience helper for other modules to emit an in-app notification
   * without throwing on validation. Best-effort.
   */
  async emit(input: CreateNotificationInput): Promise<void> {
    try {
      await this.create(input);
    } catch (e) {
      console.error("Failed to emit notification:", (e as Error)?.message);
    }
  }

  /**
   * Fan a single payload out to many recipients. Each recipient gets their
   * own row (and SSE push). Failures for individual users are swallowed so
   * one bad write can't block the rest.
   */
  async emitMany(
    userIds: string[],
    input: Omit<CreateNotificationInput, "userId">
  ): Promise<{ delivered: number }> {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    let delivered = 0;
    await Promise.all(
      unique.map(async (userId) => {
        try {
          await this.create({ ...input, userId });
          delivered++;
        } catch (e) {
          console.error(
            `emitMany failed for user ${userId}:`,
            (e as Error)?.message
          );
        }
      })
    );
    return { delivered };
  }

  /**
   * Look up active users with any of the given role names and fan out a
   * single payload. Useful for alerts that should land in every admin's
   * inbox (new ticket, new report, etc.).
   *
   * `excludeUserId` skips the actor so they don't notify themselves.
   */
  async emitToRoles(
    roleNames: string[],
    input: Omit<CreateNotificationInput, "userId">,
    excludeUserId?: string
  ): Promise<{ delivered: number }> {
    const upper = roleNames.map((r) => r.toUpperCase());
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        roles: { some: { role: { name: { in: upper } } } },
      },
      select: { id: true },
    });
    return this.emitMany(
      users.map((u) => u.id),
      input
    );
  }

  async findAll() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByUser(
    userId: string,
    opts: { take?: number; unreadOnly?: boolean } = {}
  ) {
    const take = opts.take && opts.take > 0 ? Math.min(opts.take, 100) : 50;
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(opts.unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { count: result.count };
  }

  async remove(id: string) {
    await this.prisma.notification.delete({ where: { id } });
    return { message: "Notification deleted" };
  }
}
