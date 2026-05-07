"use client";

import React from "react";
import type { UserLite } from "@/app/services/launch/types";
import { cn } from "@/shared/utils/cn";
import { UserIdentity } from "./UserIdentity";

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
  return (
    <div className={cn("flex w-full gap-3", mine ? "justify-end" : "justify-start", className)}>
      {!mine ? (
        <UserIdentity
          user={user}
          fallbackId={fallbackUserId}
          avatarClassName="size-8"
          nameClassName="text-sm"
          subtitle={
            <span className="inline-flex items-center gap-2">
              {roleBadge}
              {timestamp ? <span className="text-muted-foreground">{timestamp}</span> : null}
            </span>
          }
        />
      ) : null}

      <div
        className={cn(
          "max-w-[760px] rounded-2xl px-4 py-3 text-sm whitespace-pre-line leading-relaxed border shadow-sm",
          mine
            ? "bg-emerald-600 text-white border-emerald-700"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        )}
      >
        {children}
        {mine && (roleBadge || timestamp) ? (
          <div className="mt-2 text-[11px] opacity-90">
            <span className="inline-flex items-center gap-2">
              {roleBadge}
              {timestamp ? <span className="opacity-80">{timestamp}</span> : null}
            </span>
          </div>
        ) : null}
      </div>

      {mine ? (
        <UserIdentity
          user={user}
          fallbackId={fallbackUserId}
          avatarClassName="size-8"
          nameClassName="text-sm"
          subtitle={
            <span className="inline-flex items-center gap-2">
              {roleBadge}
              {timestamp ? <span className="text-muted-foreground">{timestamp}</span> : null}
            </span>
          }
        />
      ) : null}
    </div>
  );
}

