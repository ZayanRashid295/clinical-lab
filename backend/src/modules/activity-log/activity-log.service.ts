import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { normalizeIpForDisplay } from "../../common/utils/request-context.util";
import { QueryActivityLogDto } from "./dto/query-activity-log.dto";
import { LogActivityInput } from "./activity-log.types";
import {
  ACTIVITY_COMPONENT_LABELS,
  ACTIVITY_COMPONENTS,
  ACTIVITY_EVENT_LABELS,
  ACTIVITY_EVENTS,
} from "./activity-log.constants";

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
} as const;

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogActivityInput): Promise<void> {
    try {
      const metadata: Record<string, unknown> = {
        ...(input.metadata ?? {}),
      };
      if (input.ipAddressRaw) {
        metadata.ipAddressRaw = input.ipAddressRaw;
      }
      if (input.ipForwardedFor) {
        metadata.ipForwardedFor = input.ipForwardedFor;
      }

      await this.prisma.activityLog.create({
        data: {
          userId: input.userId ?? null,
          affectedUserId: input.affectedUserId ?? null,
          component: input.component,
          eventName: input.eventName,
          contextType: input.contextType ?? null,
          contextId: input.contextId ?? null,
          contextLabel: input.contextLabel ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          metadata:
            Object.keys(metadata).length > 0
              ? (metadata as Prisma.InputJsonValue)
              : undefined,
        },
      });
    } catch {
      // Never block user flows due to logging failures
    }
  }

  logAsync(input: LogActivityInput): void {
    void this.log(input);
  }

  private buildWhere(query: QueryActivityLogDto): Prisma.ActivityLogWhereInput {
    const where: Prisma.ActivityLogWhereInput = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.affectedUserId) {
      where.affectedUserId = query.affectedUserId;
    }

    if (query.component) {
      where.component = query.component;
    }

    if (query.eventName) {
      where.eventName = query.eventName;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { contextLabel: { contains: term } },
        { contextId: { contains: term } },
        { ipAddress: { contains: term } },
        {
          user: {
            OR: [
              { email: { contains: term } },
              { firstName: { contains: term } },
              { lastName: { contains: term } },
            ],
          },
        },
        {
          affectedUser: {
            OR: [
              { email: { contains: term } },
              { firstName: { contains: term } },
              { lastName: { contains: term } },
            ],
          },
        },
      ];
    }

    return where;
  }

  async findAll(query: QueryActivityLogDto) {
    const {
      page = 1,
      limit = 25,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const where = this.buildWhere(query);
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: userSelect },
          affectedUser: { select: userSelect },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.formatLogRow(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const row = await this.prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: { select: userSelect },
        affectedUser: { select: userSelect },
      },
    });

    if (!row) {
      return null;
    }

    return this.formatLogRow(row);
  }

  async getStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [total, today, uniqueUsersToday, byComponent] = await Promise.all([
      this.prisma.activityLog.count(),
      this.prisma.activityLog.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prisma.activityLog.findMany({
        where: { createdAt: { gte: startOfDay }, userId: { not: null } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      this.prisma.activityLog.groupBy({
        by: ["component"],
        _count: { component: true },
        orderBy: { _count: { component: "desc" } },
        take: 5,
      }),
    ]);

    return {
      total,
      today,
      uniqueUsersToday: uniqueUsersToday.length,
      topComponents: byComponent.map((item) => ({
        component: item.component,
        label: ACTIVITY_COMPONENT_LABELS[item.component] ?? item.component,
        count: item._count.component,
      })),
    };
  }

  getFilterOptions() {
    return {
      components: Object.values(ACTIVITY_COMPONENTS).map((value) => ({
        value,
        label: ACTIVITY_COMPONENT_LABELS[value] ?? value,
      })),
      events: Object.values(ACTIVITY_EVENTS).map((value) => ({
        value,
        label: ACTIVITY_EVENT_LABELS[value] ?? value,
      })),
    };
  }

  async exportCsv(query: QueryActivityLogDto): Promise<string> {
    const where = this.buildWhere(query);
    const rows = await this.prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10000,
      include: {
        user: { select: userSelect },
        affectedUser: { select: userSelect },
      },
    });

    const header = [
      "Time",
      "Full Name",
      "Email",
      "Affected User",
      "Affected Email",
      "Event Context",
      "Component",
      "Event Name",
      "IP Address",
      "User Agent",
    ];

    const lines = rows.map((row) => {
      const formatted = this.formatLogRow(row);
      return [
        formatted.time,
        formatted.userFullName ?? "",
        formatted.userEmail ?? "",
        formatted.affectedUserFullName ?? "",
        formatted.affectedUserEmail ?? "",
        formatted.contextLabel ?? "",
        formatted.componentLabel,
        formatted.eventLabel,
        formatted.ipAddress ?? "",
        formatted.userAgent ?? "",
      ]
        .map((cell) => this.escapeCsv(String(cell)))
        .join(",");
    });

    return [header.join(","), ...lines].join("\n");
  }

  private formatLogRow(
    row: Prisma.ActivityLogGetPayload<{
      include: {
        user: { select: typeof userSelect };
        affectedUser: { select: typeof userSelect };
      };
    }>,
  ) {
    const userFullName = row.user
      ? `${row.user.firstName} ${row.user.lastName}`.trim()
      : null;
    const affectedUserFullName = row.affectedUser
      ? `${row.affectedUser.firstName} ${row.affectedUser.lastName}`.trim()
      : null;

    const meta = (row.metadata ?? {}) as Record<string, unknown>;

    return {
      id: row.id,
      time: row.createdAt.toISOString(),
      createdAt: row.createdAt,
      userId: row.userId,
      userFullName,
      userEmail: row.user?.email ?? null,
      affectedUserId: row.affectedUserId,
      affectedUserFullName,
      affectedUserEmail: row.affectedUser?.email ?? null,
      contextType: row.contextType,
      contextId: row.contextId,
      contextLabel: row.contextLabel,
      component: row.component,
      componentLabel:
        ACTIVITY_COMPONENT_LABELS[row.component] ?? row.component,
      eventName: row.eventName,
      eventLabel: ACTIVITY_EVENT_LABELS[row.eventName] ?? row.eventName,
      ipAddress:
        normalizeIpForDisplay(row.ipAddress) ??
        normalizeIpForDisplay(meta.ipAddressRaw as string | undefined) ??
        row.ipAddress,
      ipAddressRaw: (meta.ipAddressRaw as string | undefined) ?? row.ipAddress,
      ipForwardedFor: (meta.ipForwardedFor as string | undefined) ?? null,
      userAgent: row.userAgent,
      metadata: row.metadata,
    };
  }

  private escapeCsv(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
