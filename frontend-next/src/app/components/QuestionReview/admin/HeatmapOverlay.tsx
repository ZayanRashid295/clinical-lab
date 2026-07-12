"use client";

import { heatmapEmoji, heatmapStyles } from "./qa-admin-utils";

type HeatmapItem = {
  section: string;
  count: number;
  level: string;
};

export function HeatmapOverlay({ items }: { items: HeatmapItem[] }) {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div
          key={item.section}
          className={`rounded-lg border px-3 py-2 text-xs ${heatmapStyles(item.level)}`}
        >
          <span className="mr-1.5">{heatmapEmoji(item.level)}</span>
          <span className="font-medium">{item.section}</span>
          <span className="ml-2 opacity-70">
            {item.count === 0 ? "No issues" : `${item.count} issue${item.count === 1 ? "" : "s"}`}
          </span>
        </div>
      ))}
    </div>
  );
}
