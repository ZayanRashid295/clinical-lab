"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/shared/utils/cn";

type Props = {
  count: number;
  className?: string;
};

export function CommentBadge({ count, className }: Props) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium dark:bg-primary/20 dark:text-primary-300",
        className
      )}
    >
      <MessageSquare className="h-3 w-3" />
      {count}
    </span>
  );
}
