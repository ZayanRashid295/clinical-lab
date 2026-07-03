import type { ActivityComponent, ActivityEventName } from "./activity-log.constants";

export interface ActivityLogContext {
  ipAddress?: string;
  ipAddressRaw?: string;
  ipForwardedFor?: string;
  userAgent?: string;
}

export interface LogActivityInput {
  userId?: string | null;
  affectedUserId?: string | null;
  component: ActivityComponent | string;
  eventName: ActivityEventName | string;
  contextType?: string | null;
  contextId?: string | null;
  contextLabel?: string | null;
  ipAddress?: string | null;
  ipAddressRaw?: string | null;
  ipForwardedFor?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}
