"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Lock, Sparkles } from "lucide-react";

export interface SubscriptionUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Short product name, e.g. "Study Planner" */
  featureLabel: string;
}

/**
 * Shown when a 403 indicates the current subscription does not include a feature.
 * Keeps copy user-facing; avoids exposing internal entitlement keys.
 */
export function SubscriptionUpgradeModal({
  open,
  onOpenChange,
  featureLabel,
}: SubscriptionUpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 overflow-hidden border-border/60 p-0 shadow-xl">
        <DialogHeader className="space-y-3 px-6 pt-6 pb-4 text-left border-b border-border/50 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15"
              aria-hidden
            >
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground pr-8">
                {featureLabel} is not on your current plan
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                This area is included with a subscription that covers{" "}
                <span className="font-medium text-foreground/90">{featureLabel}</span>.
                You can review available plans and upgrade when you are ready—your
                progress elsewhere in the app is not affected.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3">
          <div className="flex gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden />
            <p className="leading-relaxed">
              After upgrading, refresh this page or return from{" "}
              <span className="font-medium text-foreground/90">My subscription</span>{" "}
              to use {featureLabel} immediately.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end px-6 pb-6 pt-0 border-t-0">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button type="button" className="w-full sm:w-auto" asChild>
            <Link href="/my-subscription" onClick={() => onOpenChange(false)}>
              View plans and subscription
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
