import React from "react";
import { ActivityLogStats } from "../../types/activity-log";
import { Activity, Clock, TrendingUp, Users } from "lucide-react";

interface ActivityLogStatsBarProps {
  stats: ActivityLogStats | null;
  loading: boolean;
  onFilterToday?: () => void;
  onFilterComponent?: (component: string) => void;
}

export default function ActivityLogStatsBar({
  stats,
  loading,
  onFilterToday,
  onFilterComponent,
}: ActivityLogStatsBarProps) {
  const cards = [
    {
      key: "total",
      label: "All-time events",
      value: stats?.total ?? 0,
      hint: "Complete audit history",
      icon: Activity,
      onClick: undefined,
    },
    {
      key: "today",
      label: "Today",
      value: stats?.today ?? 0,
      hint: "Click to filter today",
      icon: Clock,
      onClick: onFilterToday,
    },
    {
      key: "users",
      label: "Active users today",
      value: stats?.uniqueUsersToday ?? 0,
      hint: "Unique people with activity",
      icon: Users,
      onClick: undefined,
    },
    {
      key: "top",
      label: "Most active area",
      value: stats?.topComponents?.[0]?.label ?? "—",
      hint: stats?.topComponents?.[0]
        ? `${stats.topComponents[0].count} events`
        : "No data yet",
      icon: TrendingUp,
      onClick: stats?.topComponents?.[0]
        ? () => onFilterComponent?.(stats.topComponents![0].component)
        : undefined,
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const clickable = Boolean(card.onClick);
        return (
          <button
            key={card.key}
            type="button"
            onClick={card.onClick}
            disabled={!clickable}
            className={`text-left rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all ${
              clickable
                ? "hover:border-primary/40 hover:shadow-md cursor-pointer"
                : "cursor-default"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p
                  className={`mt-1 font-semibold text-gray-900 truncate ${
                    card.isText ? "text-lg" : "text-2xl"
                  }`}
                >
                  {loading ? "…" : card.value}
                </p>
                <p className="mt-1 text-xs text-gray-400">{card.hint}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
