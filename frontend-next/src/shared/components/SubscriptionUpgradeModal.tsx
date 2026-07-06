"use client";

import React from "react";
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
import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface SubscriptionUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabel?: string;
}

export function SubscriptionUpgradeModal({
  open,
  onOpenChange,
  featureLabel,
}: SubscriptionUpgradeModalProps) {
  const feature = featureLabel ?? "This feature";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-hidden border-primary/25 p-0 sm:max-w-md",
          "dark:border-primary/35"
        )}
      >
        <div className="border-b border-primary/15 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pb-5 pt-6 dark:border-primary/25 dark:from-primary/25 dark:via-primary/10">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Crown className="h-6 w-6" />
          </div>
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-xl">Upgrade your plan</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              <span className="font-semibold text-foreground">{feature}</span> requires an active
              subscription. Pick a plan and apply a promotion code at checkout if you have one.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-6 py-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 dark:border-emerald-500/30 dark:bg-emerald-500/15">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              Unlock question bank, study tools, and more with a paid plan.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/80 bg-muted/20 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03] sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button asChild className="shadow-sm">
            <Link href="/pricing" onClick={() => onOpenChange(false)}>
              View plans
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SubscriptionUpgradeModal;
