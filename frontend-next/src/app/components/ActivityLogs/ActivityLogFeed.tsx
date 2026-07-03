import React from "react";
import { ActivityLog } from "../../types/activity-log";
import ActivityLogFeedItem from "./ActivityLogFeedItem";
import { Activity, Loader2 } from "lucide-react";

interface ActivityLogFeedProps {
  logs: ActivityLog[];
  loading: boolean;
  onSelect: (log: ActivityLog) => void;
}

export default function ActivityLogFeed({
  logs,
  loading,
  onSelect,
}: ActivityLogFeedProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Loading activity…</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 px-6 text-center">
        <Activity className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">No activity yet</h3>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          When users sign in, take tests, or admins make changes, those events
          will show up here. Try clearing filters or choosing a wider date range.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <ActivityLogFeedItem key={log.id} log={log} onClick={onSelect} />
      ))}
    </div>
  );
}
