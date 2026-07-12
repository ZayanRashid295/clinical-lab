"use client";

import { useState } from "react";
import { ZoomIn, MessageSquarePlus, MapPin } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { CommentBadge } from "./CommentBadge";
import { useReviewContext } from "./ReviewContext";
import { anchorYFromEvent } from "./review-panel-position";

type Props = {
  imageId: string;
  src: string;
  alt?: string;
  caption?: string;
};

export function ReviewableImage({ imageId, src, alt, caption }: Props) {
  const { openDrawer, countForTarget } = useReviewContext();
  const [annotateMode, setAnnotateMode] = useState(false);
  const [pins, setPins] = useState<Array<{ x: number; y: number }>>([]);
  const targetKey = `image:${imageId}`;
  const count = countForTarget(targetKey) + pins.length;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotateMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPins((p) => [...p, { x, y }]);
    openDrawer({
      targetType: "IMAGE",
      targetKey,
      section: "Image",
      preview: alt || caption || "Image",
      anchorMeta: { x, y, unit: "percent" },
      anchorY: e.clientY,
    });
    setAnnotateMode(false);
  };

  return (
    <figure className="group relative rounded-xl overflow-hidden border dark:border-slate-700">
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
              section: "Image",
              preview: alt || caption,
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
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
