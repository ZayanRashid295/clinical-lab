import { Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RealtimeBus } from "./realtime.bus";

interface AuthedSocket extends Socket {
  data: Socket["data"] & {
    userId?: string;
    roles?: string[];
  };
}

type RoomKind = "discussion" | "group" | "ticket";

interface JoinPayload {
  kind: RoomKind;
  id: string;
}

/**
 * Single global gateway exposing real-time events for every domain.
 * Namespace: `/realtime`
 *
 * Auth: JWT via `auth.token` (preferred) or `?token=` query param. The token
 * is verified once at handshake; we attach `userId` + `roles` to socket data.
 *
 * Each connection auto-joins `user:<userId>`. Clients then opt into per-domain
 * rooms via the `room:join` / `room:leave` events.
 */
@WebSocketGateway({
  namespace: "/realtime",
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly bus: RealtimeBus
  ) {}

  onModuleInit() {
    // Bus is set in afterInit when server is wired up
  }

  afterInit(server: Server) {
    this.bus.setServer(server);
    this.logger.log("Realtime gateway initialised on namespace /realtime");
  }

  // ────────────────────── connection lifecycle ──────────────────────
  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        (client.handshake.auth as any)?.token ||
        (client.handshake.query?.token as string | undefined);
      if (!token) {
        client.emit("error", { message: "missing auth token" });
        client.disconnect(true);
        return;
      }
      const payload: any = this.jwt.verify(token, {
        secret: this.config.get<string>("JWT_SECRET"),
      });
      const userId = payload?.sub;
      if (!userId) {
        client.disconnect(true);
        return;
      }
      client.data.userId = userId;
      client.data.roles = Array.isArray(payload?.roles) ? payload.roles : [];
      await client.join(`user:${userId}`);
      await client.join("launch");
      client.emit("ready", { userId });
    } catch (e) {
      this.logger.warn(
        `Rejected socket ${client.id}: ${(e as Error)?.message}`
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket) {
    this.logger.debug(
      `Socket disconnected: ${client.id} (user=${client.data.userId ?? "?"})`
    );
  }

  // ───────────────────────── room subscriptions ─────────────────────────
  @SubscribeMessage("room:join")
  async onJoin(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: JoinPayload
  ) {
    const userId = client.data.userId;
    if (!userId || !body?.kind || !body?.id) {
      return { ok: false, error: "invalid payload" };
    }

    const allowed = await this.canJoin(userId, body.kind, body.id);
    if (!allowed) return { ok: false, error: "forbidden" };

    const room = `${body.kind}:${body.id}`;
    await client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage("room:leave")
  async onLeave(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: JoinPayload
  ) {
    if (!body?.kind || !body?.id) return { ok: false };
    await client.leave(`${body.kind}:${body.id}`);
    return { ok: true };
  }

  /** Optional ping for client-side latency measurement. */
  @SubscribeMessage("ping")
  onPing() {
    return { pong: Date.now() };
  }

  /** Allows clients to ack a notification through the socket if they prefer. */
  @SubscribeMessage("notification:read")
  async onNotificationRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { id: string }
  ) {
    const userId = client.data.userId;
    if (!userId || !body?.id) return { ok: false };
    try {
      await this.prisma.notification.updateMany({
        where: { id: body.id, userId },
        data: { isRead: true, readAt: new Date() },
      });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  // ───────────────────────── access checks ─────────────────────────
  private async canJoin(
    userId: string,
    kind: RoomKind,
    id: string
  ): Promise<boolean> {
    try {
      if (kind === "discussion") {
        // Discussions are public; just verify it exists
        const d = await this.prisma.discussion.findUnique({
          where: { id },
          select: { id: true },
        });
        return !!d;
      }
      if (kind === "group") {
        const member = await this.prisma.studyGroupMember.findUnique({
          where: { groupId_userId: { groupId: id, userId } },
        });
        if (member) return true;
        const group = await this.prisma.studyGroup.findUnique({
          where: { id },
          select: { isPrivate: true },
        });
        // Public groups are visible even to non-members
        return !!group && !group.isPrivate;
      }
      if (kind === "ticket") {
        const ticket = await this.prisma.feedbackTicket.findUnique({
          where: { id },
          select: { userId: true, assigneeId: true },
        });
        if (!ticket) return false;
        if (ticket.userId === userId) return true;
        if (ticket.assigneeId === userId) return true;
        // Staff can also join
        const staff = await this.prisma.user.findFirst({
          where: {
            id: userId,
            roles: {
              some: {
                role: { name: { in: ["SUPERADMIN", "ADMIN", "FACULTY"] } },
              },
            },
          },
          select: { id: true },
        });
        return !!staff;
      }
    } catch (e) {
      this.logger.warn(`canJoin failed: ${(e as Error)?.message}`);
    }
    return false;
  }
}
