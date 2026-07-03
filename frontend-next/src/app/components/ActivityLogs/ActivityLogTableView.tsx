import React from "react";
import { ActivityLog } from "../../types/activity-log";
import {
  buildActivityNarrative,
  formatFullDateTime,
  formatRelativeTime,
  getComponentMeta,
  parseUserAgent,
} from "./activity-log.utils";

interface ActivityLogTableViewProps {
  logs: ActivityLog[];
  onSelect: (log: ActivityLog) => void;
}

export default function ActivityLogTableView({
  logs,
  onSelect,
}: ActivityLogTableViewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                When
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                What happened
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Area
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Origin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => {
              const meta = getComponentMeta(log.component);
              const Icon = meta.icon;
              const origin = parseUserAgent(log.userAgent);
              return (
                <tr
                  key={log.id}
                  onClick={() => onSelect(log)}
                  className="cursor-pointer transition-colors hover:bg-primary/5"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <div title={formatFullDateTime(log.time)}>
                      {formatRelativeTime(log.time)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                    <div className="font-medium">{buildActivityNarrative(log)}</div>
                    {log.userEmail && (
                      <div className="text-xs text-gray-500 mt-0.5">{log.userEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px]">
                    <div>{origin.summary}</div>
                    {log.ipAddress && <div className="truncate">{log.ipAddress}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
