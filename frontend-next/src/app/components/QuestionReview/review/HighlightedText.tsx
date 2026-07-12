"use client";

import { useMemo } from "react";
import type { HighlightItem } from "./annotation-highlight";
import { severityHighlightClass } from "./annotation-highlight";
import {
  buildHighlightSegments,
  type HighlightSegment,
} from "./highlight-text-utils";
import { cn } from "@/shared/utils/cn";

type Props = {
  text: string;
  items: HighlightItem[];
  onItemClick?: (item: HighlightItem) => void;
  className?: string;
};

function Segment({
  segment,
  onItemClick,
}: {
  segment: HighlightSegment;
  onItemClick?: (item: HighlightItem) => void;
}) {
  if (!segment.item) {
    return <>{segment.text}</>;
  }
  return (
    <mark
      className={severityHighlightClass(segment.item.severity)}
      style={{ color: "rgb(15 23 42)" }}
      title="Reviewer feedback"
      onClick={
        onItemClick
          ? (e) => {
              e.stopPropagation();
              onItemClick(segment.item!);
            }
          : undefined
      }
    >
      {segment.text}
    </mark>
  );
}

export function HighlightedText({
  text,
  items,
  onItemClick,
  className,
}: Props) {
  const segments = useMemo(
    () => buildHighlightSegments(text, items),
    [text, items]
  );

  const hasMarks = segments.some((s) => s.item);

  if (!hasMarks) {
    return <div className={cn("whitespace-pre-wrap", className)}>{text}</div>;
  }

  return (
    <div className={cn("whitespace-pre-wrap", className)}>
      {segments.map((segment, index) => (
        <Segment
          key={`${index}-${segment.text.slice(0, 12)}`}
          segment={segment}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
}
