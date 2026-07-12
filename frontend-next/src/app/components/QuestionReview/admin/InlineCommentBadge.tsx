"use client";

import { cn } from "@/shared/utils/cn";
import { MessageSquare } from "lucide-react";

type Props = {
  count: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function InlineCommentBadge({ count, active, onClick, className }: Props) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20",
        className
      )}
    >
      <MessageSquare className="h-3 w-3" />
      {count}
    </button>
  );
}
