"use client";

import { useCallback, useMemo, useState } from "react";
import { ZoomIn, MessageSquarePlus, MapPin } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { CommentBadge } from "./CommentBadge";
import { AnnotationHighlighter } from "./AnnotationHighlighter";
import { useReviewContext } from "./ReviewContext";
import { anchorYFromEvent } from "./review-panel-position";
import { annotationsToHighlightItems } from "./annotation-highlight";

type Props = {
  /** Stable key used for feedback + admin scroll (e.g. image:blockId or image:blockId:0). */
  targetKey: string;
  src: string;
  alt?: string;
  caption?: string;
  label?: string;
};

export function ReviewableImage({
  targetKey,
  src,
  alt,
  caption,
  label = "Image",
}: Props) {
  const { openDrawer, countForTarget, annotationsForBlock } = useReviewContext();
  const [annotateMode, setAnnotateMode] = useState(false);
  const [pins, setPins] = useState<Array<{ x: number; y: number }>>([]);
  const count = countForTarget(targetKey) + pins.length;
  const hasFeedback = countForTarget(targetKey) > 0;

  const captionHighlights = useMemo(
    () =>
      caption
        ? annotationsToHighlightItems(annotationsForBlock(targetKey), targetKey)
        : [],
    [annotationsForBlock, targetKey, caption]
  );

  const handleHighlightClick = useCallback(
    (item: { id: string; text: string; targetKey: string }) => {
      openDrawer({
        targetType: "IMAGE",
        targetKey: item.targetKey,
        section: label,
        selectedText: item.text,
        highlightAnnotationId: item.id,
        viewOnly: true,
      });
    },
    [openDrawer, label]
  );

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotateMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPins((p) => [...p, { x, y }]);
    openDrawer({
      targetType: "IMAGE",
      targetKey,
      section: label,
      preview: alt || caption || label,
      anchorMeta: { x, y, unit: "percent" },
      anchorY: e.clientY,
    });
    setAnnotateMode(false);
  };

  return (
    <figure
      data-review-section={label}
      data-review-target={targetKey}
      data-review-type="IMAGE"
      data-target-key={targetKey}
      className={cn(
        "group relative rounded-xl overflow-hidden border dark:border-slate-700 scroll-mt-24",
        hasFeedback && "ring-2 ring-amber-400/80 border-amber-400/60"
      )}
    >
      <div
        className={cn(
          "relative",
          annotateMode && "cursor-crosshair ring-2 ring-primary ring-offset-2"
        )}
        onClick={handleImageClick}
      >
        <img
          src={src}
          alt={alt || ""}
          className="w-full h-auto max-h-80 object-contain bg-muted/30 dark:bg-slate-900/50"
        />
        {pins.map((pin, i) => (
          <span
            key={i}
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center shadow"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <CommentBadge count={count} className="mr-1" />
        <button
          type="button"
          className="p-1.5 rounded-md bg-background/90 border text-xs dark:bg-slate-900/90 dark:border-slate-700"
          onClick={(e) =>
            openDrawer({
              targetType: "IMAGE",
              targetKey,
              section: label,
              preview: alt || caption || label,
              anchorY: anchorYFromEvent(e),
            })
          }
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className={cn(
            "p-1.5 rounded-md bg-background/90 border text-xs dark:bg-slate-900/90 dark:border-slate-700",
            annotateMode && "ring-2 ring-primary"
          )}
          onClick={() => setAnnotateMode((v) => !v)}
          title="Place pin"
        >
          <MapPin className="h-3.5 w-3.5" />
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md bg-background/90 border dark:bg-slate-900/90 dark:border-slate-700"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </a>
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground px-3 py-2 dark:text-slate-400">
          <AnnotationHighlighter
            items={captionHighlights}
            onItemClick={handleHighlightClick}
          >
            {caption}
          </AnnotationHighlighter>
        </figcaption>
      )}
    </figure>
  );
}

/** Stable target key shared by reviewer + admin image sections. */
export function imageTargetKey(blockId: string, imageIndex: number, total: number) {
  return total <= 1 ? `image:${blockId}` : `image:${blockId}:${imageIndex}`;
}
