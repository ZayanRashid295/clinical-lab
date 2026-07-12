"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { DiffViewer } from "./DiffViewer";
import { formatDate } from "./qa-admin-utils";

type Version = {
  id: string;
  version: number;
  summary: string | null;
  snapshot: Record<string, unknown>;
  createdAt: string;
  author?: { firstName?: string; lastName?: string };
};

type Props = {
  versions: Version[];
};

export function VersionHistoryPanel({ versions }: Props) {
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);

  if (!versions.length) {
    return (
      <p className="text-sm text-muted-foreground dark:text-slate-400">
        No versions saved yet. Edits create automatic versions.
      </p>
    );
  }

  const vA = versions.find((v) => v.version === compareA);
  const vB = versions.find((v) => v.version === compareB);

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {versions.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs"
          >
            <div>
              <span className="font-medium dark:text-slate-100">v{v.version}</span>
              <span className="text-muted-foreground ml-2">
                {formatDate(v.createdAt)}
              </span>
              {v.summary && (
                <p className="text-muted-foreground mt-0.5">{v.summary}</p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={compareA === v.version ? "default" : "outline"}
                className="h-7 text-[10px]"
                onClick={() => setCompareA(v.version)}
              >
                A
              </Button>
              <Button
                size="sm"
                variant={compareB === v.version ? "default" : "outline"}
                className="h-7 text-[10px]"
                onClick={() => setCompareB(v.version)}
              >
                B
              </Button>
            </div>
          </div>
        ))}
      </div>

      {vA && vB && (
        <DiffViewer
          before={JSON.stringify(vA.snapshot, null, 2)}
          after={JSON.stringify(vB.snapshot, null, 2)}
        />
      )}
    </div>
  );
}
