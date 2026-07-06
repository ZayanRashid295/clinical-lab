"use client";

import React from "react";
import Link from "next/link";
import { useBilling } from "@/hooks/useBilling";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { APP_GLASS_CARD } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";
import { Crown, Sparkles } from "lucide-react";

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    TRIALING:
      "bg-primary/15 text-primary border-primary/25 dark:bg-primary/20 dark:text-primary-200",
    ACTIVE:
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-300",
    PAST_DUE:
      "bg-amber-500/15 text-amber-800 border-amber-500/25 dark:bg-amber-500/20 dark:text-amber-300",
    CANCELED: "bg-muted text-muted-foreground border-border",
    FREE: "bg-muted text-muted-foreground border-border",
    PAYMENT_FAILED:
      "bg-red-500/15 text-red-700 border-red-500/25 dark:bg-red-500/20 dark:text-red-300",
  };
  return (
    <Badge
      variant="outline"
      className={cn("mt-2 border font-medium", colors[status] ?? colors.FREE)}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export default function SubscriptionWidget() {
  const { summary, loading } = useBilling();

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-2xl border p-4 text-sm text-muted-foreground",
          APP_GLASS_CARD,
          "bg-white/90 dark:bg-white/5"
        )}
      >
        Loading…
      </div>
    );
  }

  const sub = summary?.subscription;
  const planName = sub?.plan?.name ?? "Free";
  const status = sub?.status ?? "FREE";
  const hasPaidPlan = Boolean(sub);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 shadow-sm",
        APP_GLASS_CARD,
        hasPaidPlan
          ? cn(
              "border-primary/35 bg-gradient-to-br from-primary/[0.14] via-white/95 to-white/90",
              "dark:from-primary/20 dark:via-white/[0.07] dark:to-white/[0.04]",
              "dark:border-primary/40 shadow-md shadow-primary/10"
            )
          : "border-border bg-white/90 dark:border-white/10 dark:bg-white/5"
      )}
    >
      {hasPaidPlan && (
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl"
          aria-hidden
        />
      )}

      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            hasPaidPlan
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Crown className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">Subscription</h3>
          <p className="mt-0.5 text-lg font-bold text-foreground">{planName}</p>
          {statusBadge(status)}
        </div>
      </div>

      {summary?.trialDaysRemaining != null && summary.trialDaysRemaining > 0 && (
        <div className="relative mt-4 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 dark:border-primary/35 dark:bg-primary/15">
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary dark:text-primary-200">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {summary.trialDaysRemaining} day{summary.trialDaysRemaining === 1 ? "" : "s"} left in trial
          </p>
        </div>
      )}

      <div className="relative mt-4 space-y-1 text-sm">
        {summary?.nextBillingDate && (
          <p className="text-muted-foreground">
            Next billing:{" "}
            <span className="font-medium text-foreground">
              {new Date(summary.nextBillingDate).toLocaleDateString()}
            </span>
          </p>
        )}
        {summary?.amount != null && (
          <p className="font-semibold text-foreground">
            ${Number(summary.amount).toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground">
              /{sub?.billingInterval === "YEARLY" ? "yr" : "mo"}
            </span>
          </p>
        )}
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <Button size="sm" className="shadow-sm" asChild>
          <Link href="/billing">{sub ? "Manage Billing" : "Upgrade"}</Link>
        </Button>
        {!sub && (
          <Button
            size="sm"
            variant="outline"
            className="border-primary/30 hover:bg-primary/5 dark:border-primary/35 dark:hover:bg-primary/10"
            asChild
          >
            <Link href="/pricing">View Plans</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
