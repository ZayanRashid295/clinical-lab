import React from "react";
import {
  detectActivePreset,
  getDateRangeForPreset,
  QuickFilterPreset,
} from "./activity-log.utils";
import { ActivityLogQueryParams } from "../../types/activity-log";

const PRESETS: Array<{ id: QuickFilterPreset; label: string }> = [
  { id: "all", label: "All activity" },
  { id: "today", label: "Today" },
  { id: "week", label: "Last 7 days" },
  { id: "auth", label: "Sign-ins" },
  { id: "assessment", label: "Tests & quizzes" },
  { id: "qbank", label: "Question bank" },
];

interface ActivityLogQuickFiltersProps {
  filters: ActivityLogQueryParams;
  onApply: (patch: Partial<ActivityLogQueryParams>) => void;
}

export default function ActivityLogQuickFilters({
  filters,
  onApply,
}: ActivityLogQuickFiltersProps) {
  const active = detectActivePreset(filters);

  const applyPreset = (preset: QuickFilterPreset) => {
    if (preset === "all") {
      onApply({
        component: undefined,
        eventName: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
      });
      return;
    }

    const range = getDateRangeForPreset(preset);
    onApply({
      component: range.component,
      eventName: undefined,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      page: 1,
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset) => {
        const isActive = active === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
