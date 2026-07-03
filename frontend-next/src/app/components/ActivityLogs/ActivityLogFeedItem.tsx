import React from "react";
import { ChevronRight, Globe, Monitor } from "lucide-react";
import { ActivityLog } from "../../types/activity-log";
import {
  buildActivityNarrative,
  buildActivitySubtext,
  formatFullDateTime,
  formatRelativeTime,
  getComponentMeta,
  getInitials,
  parseUserAgent,
} from "./activity-log.utils";

interface ActivityLogFeedItemProps {
  log: ActivityLog;
  onClick: (log: ActivityLog) => void;
}

export default function ActivityLogFeedItem({
  log,
  onClick,
}: ActivityLogFeedItemProps) {
  const meta = getComponentMeta(log.component);
  const Icon = meta.icon;
  const narrative = buildActivityNarrative(log);
  const subtext = buildActivitySubtext(log);
  const origin = parseUserAgent(log.userAgent);

  return (
    <button
      type="button"
      onClick={() => onClick(log)}
      className="group w-full text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(log.userFullName)}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${meta.dotClass}`}
            title={meta.label}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 leading-snug pr-2">
              {narrative}
            </p>
            <time
              className="shrink-0 text-xs text-gray-500"
              title={formatFullDateTime(log.time)}
            >
              {formatRelativeTime(log.time)}
            </time>
          </div>

          {subtext && (
            <p className="mt-1 text-sm text-gray-600">{subtext}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
            </span>

            {log.ipAddress && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Globe className="h-3 w-3" />
                {log.ipAddress}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Monitor className="h-3 w-3" />
              {origin.summary}
            </span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 self-center text-gray-300 transition-colors group-hover:text-primary" />
      </div>
    </button>
  );
}
