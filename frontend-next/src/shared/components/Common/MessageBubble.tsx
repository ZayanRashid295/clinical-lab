"use client";

import React from "react";
import type { UserLite } from "@/app/services/launch/types";
import { cn } from "@/shared/utils/cn";
import { displayName } from "./UserIdentity";
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

function initials(first?: string, last?: string) {
  const a = (first ?? "").trim().slice(0, 1).toUpperCase();
  const b = (last ?? "").trim().slice(0, 1).toUpperCase();
  const out = `${a}${b}`.trim();
  return out || "U";
}

/**
 * Chat-style bubble: one timestamp, no duplicated metadata.
 * Incoming: avatar + name/time row + bubble. Outgoing: bubble + footer meta only.
 */
export function MessageBubble({
  mine,
  user,
  fallbackUserId,
  roleBadge,
  timestamp,
  children,
  className,
}: {
  mine: boolean;
  user?: UserLite | null;
  fallbackUserId?: string;
  roleBadge?: React.ReactNode;
  timestamp?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const name = displayName(user, fallbackUserId);

  if (mine) {
    return (
      <div className={cn("flex w-full justify-end", className)}>
        <div className="flex max-w-[min(680px,92%)] flex-col items-end gap-1">
          <div
            className={cn(
              "rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed shadow-sm",
              "bg-emerald-600 text-white dark:bg-emerald-700"
            )}
          >
            {typeof children === "string" ? (
              <MarkdownContent variant="bubbleMine">{children}</MarkdownContent>
            ) : (
              children
            )}
          </div>
          {(timestamp || roleBadge) ? (
            <div className="flex items-center gap-2 pr-0.5 text-[11px] text-muted-foreground">
              {roleBadge}
              {timestamp ? <span className="tabular-nums">{timestamp}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full justify-start gap-2.5", className)}>
      <Avatar className="mt-1 size-9 shrink-0">
        {user?.avatar ? <AvatarImage src={user.avatar} alt={name} /> : null}
        <AvatarFallback className="text-xs font-semibold">
          {initials(user?.firstName, user?.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 max-w-[min(680px,calc(100%-2.75rem))] flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 text-xs">
          <span className="font-semibold text-foreground">{name}</span>
          {timestamp ? (
            <span className="font-normal text-muted-foreground tabular-nums">
              {timestamp}
            </span>
          ) : null}
          {roleBadge}
        </div>
        <div
          className={cn(
            "rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-900 shadow-sm",
            "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          )}
        >
          {typeof children === "string" ? (
            <MarkdownContent variant="bubbleIncoming">{children}</MarkdownContent>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
