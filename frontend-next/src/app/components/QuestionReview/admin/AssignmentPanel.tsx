"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { QA_ISSUE_STATUSES, formatStatus } from "./qa-admin-utils";

type Assignee = { id: string; name: string };

type Props = {
  status: string;
  assignedToId: string | null;
  assignees: Assignee[];
  onStatusChange: (status: string) => void;
  onAssign: (userId: string | null) => void;
  saving?: boolean;
};

export function AssignmentPanel({
  status,
  assignedToId,
  assignees,
  onStatusChange,
  onAssign,
  saving,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground dark:text-slate-400">
          Status
        </label>
        <Select value={status} onValueChange={onStatusChange} disabled={saving}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QA_ISSUE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {formatStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground dark:text-slate-400">
          Assigned to
        </label>
        <Select
          value={assignedToId ?? "unassigned"}
          onValueChange={(v) => onAssign(v === "unassigned" ? null : v)}
          disabled={saving}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
