import { Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";

/**
 * Tiny façade around the socket.io server so other modules don't have to
 * depend directly on the gateway. The gateway calls `setServer()` once at
 * boot, then any service can fire room-scoped events.
 *
 * Room naming convention:
 *   user:<userId>            -> private channel for one logged-in user
 *   discussion:<id>          -> everyone currently viewing a discussion
 *   group:<id>               -> members of a study group
 *   ticket:<id>              -> ticket owner + assignee/staff
 */
@Injectable()
export class RealtimeBus {
  private readonly logger = new Logger(RealtimeBus.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  isReady(): boolean {
    return this.server !== null;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToUsers(userIds: string[], event: string, payload: unknown) {
    if (!this.server || userIds.length === 0) return;
    const rooms = Array.from(new Set(userIds))
      .filter(Boolean)
      .map((id) => `user:${id}`);
    this.server.to(rooms).emit(event, payload);
  }

  emitToDiscussion(discussionId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`discussion:${discussionId}`).emit(event, payload);
  }

  emitToGroup(groupId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`group:${groupId}`).emit(event, payload);
  }

  emitToTicket(ticketId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`ticket:${ticketId}`).emit(event, payload);
  }

  /** Server-wide broadcast (admin announcements). */
  broadcast(event: string, payload: unknown) {
    if (!this.server) return;
    this.server.emit(event, payload);
  }

  /**
   * All authenticated sockets join `launch` — use for cross-feature updates
   * (e.g. achievements leaderboard) without per-resource rooms.
   */
  emitToLaunch(event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to("launch").emit(event, payload);
  }
}
