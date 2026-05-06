"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import type { UserLite } from "@/app/services/launch/types";
import { cn } from "@/shared/utils/cn";

function initials(first?: string, last?: string) {
  const a = (first ?? "").trim().slice(0, 1).toUpperCase();
  const b = (last ?? "").trim().slice(0, 1).toUpperCase();
  const out = `${a}${b}`.trim();
  return out || "U";
}

export function displayName(user?: UserLite | null, fallbackId?: string) {
  const fn = (user?.firstName ?? "").trim();
  const ln = (user?.lastName ?? "").trim();
  const name = `${fn} ${ln}`.trim();
  if (name) return name;
  if (user?.email) return user.email;
  if (fallbackId) return `User ${fallbackId.slice(0, 6)}…`;
  return "Unknown user";
}

export function UserIdentity({
  user,
  fallbackId,
  subtitle,
  className,
  avatarClassName,
  nameClassName,
}: {
  user?: UserLite | null;
  fallbackId?: string;
  subtitle?: React.ReactNode;
  className?: string;
  avatarClassName?: string;
  nameClassName?: string;
}) {
  const name = displayName(user, fallbackId);
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <Avatar className={cn("size-8", avatarClassName)}>
        {user?.avatar ? <AvatarImage src={user.avatar} alt={name} /> : null}
        <AvatarFallback className="text-xs font-semibold">
          {initials(user?.firstName, user?.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className={cn("text-sm font-semibold truncate", nameClassName)}>
          {name}
        </div>
        {subtitle ? (
          <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}

