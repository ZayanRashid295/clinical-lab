"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Subscription } from "@/app/types/subscription";
import { Calendar, Package, ShieldAlert } from "lucide-react";

interface ExistingSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelAndCreate: () => void;
  onContinueWithExisting: () => void;
  existingSubscription: Subscription | null;
}

export function ExistingSubscriptionModal({
  isOpen,
  onClose,
  onCancelAndCreate,
  onContinueWithExisting,
  existingSubscription,
}: ExistingSubscriptionModalProps) {
  if (!existingSubscription) return null;

  const packageName = existingSubscription.subscriptionPackage?.name || "Unknown Package";
  const endDate = existingSubscription.endDate
    ? new Date(existingSubscription.endDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-white/75 dark:bg-white/5 backdrop-blur-xl shadow-[0_22px_60px_-40px_rgba(15,23,42,0.65)] ring-1 ring-black/5 dark:ring-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-sky-500/10 dark:from-blue-400/15 dark:via-indigo-400/10 dark:to-sky-400/10 ring-1 ring-blue-500/10 dark:ring-blue-400/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </span>
            Active subscription detected
          </DialogTitle>
          <DialogDescription>
            You can keep your current plan, or switch to the new one. Switching will cancel your current subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-2xl bg-white/60 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-4 shadow-[0_16px_45px_-38px_rgba(0,0,0,0.55)]">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Current plan
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {packageName}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="truncate">Valid until {endDate}</span>
                </div>
              </div>
              <span className="shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-emerald-900 dark:text-emerald-200 bg-gradient-to-r from-emerald-200/70 to-emerald-100/40 dark:from-emerald-900/40 dark:to-emerald-900/20 ring-1 ring-emerald-200/70 dark:ring-emerald-700/40">
                ACTIVE
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 ring-1 ring-amber-200/70 dark:ring-amber-800/40 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-8 w-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 ring-1 ring-amber-500/15 dark:ring-amber-400/15 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                  Switching plans
                </p>
                <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
                  If you continue with checkout, your current subscription will be cancelled and replaced with the new subscription.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <Button variant="outline" className="w-full sm:w-auto" onClick={onContinueWithExisting}>
              Keep current plan
            </Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={onCancelAndCreate}>
              Switch to new plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
































