import React from "react";
import { Activity, Clock, Globe, User } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import {
  ActivityLog,
  ActivityLogFilterOptions,
  ActivityLogFilters,
} from "../../types/activity-log";
import { ActivityLogsService } from "../../services/admin/activity-logs.service";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));

const activityLogColumns: ColumnConfig<ActivityLog>[] = [
  {
    key: "time",
    label: "Time",
    sortable: true,
    sortKey: "createdAt",
    render: (value) => (
      <span className="text-sm text-gray-900 whitespace-nowrap">
        {formatDateTime(value)}
      </span>
    ),
  },
  {
    key: "userFullName",
    label: "Full Name",
    sortable: false,
    render: (_value, row) => (
      <div>
        <div className="text-sm font-medium text-gray-900">
          {row.userFullName ?? "System"}
        </div>
        {row.userEmail && (
          <div className="text-xs text-gray-500">{row.userEmail}</div>
        )}
      </div>
    ),
  },
  {
    key: "affectedUserFullName",
    label: "Affected User",
    sortable: false,
    render: (_value, row) => (
      <div>
        <div className="text-sm text-gray-900">
          {row.affectedUserFullName ?? "—"}
        </div>
        {row.affectedUserEmail && (
          <div className="text-xs text-gray-500">{row.affectedUserEmail}</div>
        )}
      </div>
    ),
  },
  {
    key: "contextLabel",
    label: "Event Context",
    sortable: false,
    render: (value, row) => (
      <div>
        <div className="text-sm text-gray-900">{value ?? row.contextId ?? "—"}</div>
        {row.contextType && (
          <div className="text-xs text-gray-500">{row.contextType}</div>
        )}
      </div>
    ),
  },
  {
    key: "componentLabel",
    label: "Component",
    sortable: true,
    sortKey: "component",
    render: (value) => (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
        {value}
      </span>
    ),
  },
  {
    key: "eventLabel",
    label: "Event Name",
    sortable: true,
    sortKey: "eventName",
    render: (value) => (
      <span className="text-sm text-gray-900">{value}</span>
    ),
  },
  {
    key: "ipAddress",
    label: "Origin",
    sortable: false,
    render: (value, row) => (
      <div className="max-w-[180px]">
        <div className="text-xs text-gray-900 truncate">{value ?? "—"}</div>
        {row.userAgent && (
          <div className="text-xs text-gray-500 truncate" title={row.userAgent}>
            {row.userAgent}
          </div>
        )}
      </div>
    ),
  },
];

export function createActivityLogTableConfig(
  filterOptions?: ActivityLogFilterOptions | null,
): TableConfig<ActivityLog, ActivityLogFilters> {
  const filterConfig: FilterConfig<ActivityLogFilters> = {
    fields: [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Name, email, context, or IP",
      },
      {
        key: "component",
        label: "Component",
        type: "select",
        options: filterOptions?.components ?? [],
      },
      {
        key: "eventName",
        label: "Event",
        type: "select",
        options: filterOptions?.events ?? [],
      },
      {
        key: "dateFrom",
        label: "From",
        type: "date",
      },
      {
        key: "dateTo",
        label: "To",
        type: "date",
      },
    ],
    layout: "grid",
    showActiveFilters: true,
  };

  const statsConfig: StatsConfig = {
    cards: [
      {
        key: "total",
        label: "Total Events",
        icon: <Activity className="h-8 w-8" />,
        getValue: (stats) => stats?.total ?? 0,
      },
      {
        key: "today",
        label: "Events Today",
        icon: <Clock className="h-8 w-8" />,
        getValue: (stats) => stats?.today ?? 0,
      },
      {
        key: "uniqueUsersToday",
        label: "Active Users Today",
        icon: <User className="h-8 w-8" />,
        getValue: (stats) => stats?.uniqueUsersToday ?? 0,
      },
      {
        key: "topComponent",
        label: "Top Component",
        icon: <Globe className="h-8 w-8" />,
        getValue: (stats) => stats?.topComponents?.[0]?.label ?? "—",
      },
    ],
    getStats: async () => {
      const service = new ActivityLogsService();
      return service.getStats();
    },
  };

  return {
    title: "Activity Logs",
    description:
      "Moodle-style audit trail of user interactions — logins, assessments, content changes, and more.",
    columns: activityLogColumns,
    filterConfig,
    stats: statsConfig,
    emptyStateIcon: (
      <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    ),
    emptyStateMessage: "No activity logs found for the selected filters",
  };
}
