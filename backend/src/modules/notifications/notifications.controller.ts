import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Sse,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Observable, fromEvent, interval, map, merge, takeUntil } from "rxjs";
import type { MessageEvent } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Server-Sent Events stream for the current user's notifications.
   *
   * Uses a query-token (`?token=<jwt>`) for auth because the browser's
   * EventSource API cannot send Authorization headers. Every other route
   * still uses the standard JwtAuthGuard.
   */
  @Sse("me/stream")
  @ApiOperation({
    summary: "Live notification stream (SSE) for the current user",
  })
  stream(
    @Query("token") token: string,
    @Request() req: any
  ): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException("token query parameter is required");
    }
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("invalid token");
    }
    const userId: string | undefined = payload?.sub;
    if (!userId) {
      throw new UnauthorizedException("invalid token payload");
    }

    // 25s keep-alive comment so proxies / load balancers don't drop the conn
    const keepAlive$ = interval(25_000).pipe(
      map(() => ({ data: { type: "ping" } }) as MessageEvent)
    );

    const events$ = this.notificationsService.stream(userId).pipe(
      map(
        (evt) =>
          ({
            data: evt,
            type: evt.type,
          }) as MessageEvent
      )
    );

    const close$ = fromEvent(req, "close");
    return merge(events$, keepAlive$).pipe(takeUntil(close$));
  }
}

@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsAuthedController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: "Create notification (admin/internal)" })
  @ApiResponse({ status: 201, description: "Notification created" })
  create(@Body() createNotificationDto: any) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get("me")
  @ApiOperation({ summary: "Get current user's notifications" })
  async myNotifications(
    @Request() req,
    @Query("unreadOnly") unreadOnly?: string,
    @Query("take") take?: string
  ) {
    const userId = req.user?.userId;
    return this.notificationsService.findByUser(userId, {
      unreadOnly: unreadOnly === "true",
      take: take ? Number(take) : undefined,
    });
  }

  @Get("me/unread-count")
  @ApiOperation({ summary: "Get unread count for current user" })
  async unreadCount(@Request() req) {
    const userId = req.user?.userId;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Get()
  @ApiOperation({ summary: "Get all notifications (admin)" })
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get notifications for specific user" })
  findByUser(@Param("userId") userId: string) {
    return this.notificationsService.findByUser(userId);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  markAsRead(@Param("id") id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch("me/read-all")
  @ApiOperation({ summary: "Mark all of my notifications as read" })
  markAllAsRead(@Request() req) {
    const userId = req.user?.userId;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification" })
  remove(@Param("id") id: string) {
    return this.notificationsService.remove(id);
  }
}
