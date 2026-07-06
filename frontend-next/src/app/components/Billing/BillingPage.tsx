"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useBilling, useBillingPlans } from "@/hooks/useBilling";
import { billingService, BillingInterval, BillingPlan } from "@/app/services/billing/billing.service";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import SubscriptionModal from "./SubscriptionModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { APP_GLASS_CARD, APP_PAGE_PADDING, APP_PAGE_SHELL } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";
import { CreditCard, FileText, Receipt, Sparkles, Wallet, X, Crown } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

const SECTION_CARD = cn(
  "rounded-2xl border p-6 shadow-sm",
  APP_GLASS_CARD,
  "bg-white/90 dark:bg-white/5"
);

const HERO_SECTION = cn(
  "relative overflow-hidden rounded-2xl border p-6 shadow-md",
  APP_GLASS_CARD,
  "border-primary/35 bg-gradient-to-br from-primary/[0.12] via-white/95 to-white/90",
  "dark:from-primary/20 dark:via-white/[0.07] dark:to-white/[0.04]",
  "dark:border-primary/40 shadow-primary/10"
);

function SectionTitle({
  icon: Icon,
  title,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  iconClassName?: string;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold text-foreground">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary dark:bg-primary/25",
          iconClassName
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      {title}
    </h2>
  );
}

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    TRIALING:
      "bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200",
    ACTIVE:
      "bg-green-100 text-green-800 dark:bg-green-900/35 dark:text-green-200",
    PAST_DUE:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-200",
    CANCELED:
      "bg-muted text-muted-foreground dark:bg-white/10 dark:text-slate-400",
    PAYMENT_FAILED:
      "bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-200",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      const { clientSecret } = await billingService.createSetupIntent();
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Card element not found");
      const result = await stripe.confirmCardSetup(clientSecret, { payment_method: { card } });
      if (result.error) throw new Error(result.error.message);
      const pmId = result.setupIntent?.payment_method;
      if (typeof pmId !== "string") throw new Error("No payment method returned");
      await billingService.updatePaymentMethod(pmId);
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update payment method";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-white/5"
    >
      <CardElement
        className="rounded-md border border-border bg-background p-3 dark:border-white/10 dark:bg-white/5"
        options={{
          style: {
            base: {
              color: "var(--foreground-color, #111827)",
              fontFamily: "inherit",
              "::placeholder": { color: "var(--muted-foreground-color, #6b7280)" },
            },
          },
        }}
      />
      {error && (
        <p className="text-sm text-destructive dark:text-red-400">{error}</p>
      )}
      <Button type="submit" disabled={loading} size="sm">
        {loading ? "Saving..." : "Update Payment Method"}
      </Button>
    </form>
  );
}

export default function BillingPage() {
  const { summary, loading, error, refresh } = useBilling();
  const { plans } = useBillingPlans();
  const [actionLoading, setActionLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [modalPlan, setModalPlan] = useState<BillingPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>("MONTHLY");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const sub = summary?.subscription;
  const pm = summary?.paymentMethod;
  const managedByStripe = summary?.managedByStripe ?? false;

  const handleCancel = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await billingService.cancel();
      setShowCancelDialog(false);
      await refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not cancel subscription";
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await billingService.resume();
      await refresh();
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlanSelect = async (plan: BillingPlan) => {
    if (sub?.plan?.id === plan.id) return;

    const useStripeChangePlan =
      managedByStripe &&
      sub &&
      sub.status !== "CANCELED" &&
      !sub.cancelAtPeriodEnd;

    if (useStripeChangePlan) {
      setActionLoading(true);
      setActionError(null);
      try {
        await billingService.changePlan(plan.id, interval);
        setShowUpgrade(false);
        await refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Could not change plan";
        setActionError(message);
      } finally {
        setActionLoading(false);
      }
      return;
    }

    setModalPlan(plan);
    setModalOpen(true);
    setShowUpgrade(false);
  };

  if (loading) {
    return (
      <div className={cn(APP_PAGE_SHELL, APP_PAGE_PADDING)}>
        <div className="py-20 text-center text-muted-foreground">Loading billing…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(APP_PAGE_SHELL, APP_PAGE_PADDING)}>
        <div className="py-20 text-center text-destructive dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className={cn(APP_PAGE_SHELL, APP_PAGE_PADDING, "relative space-y-6 overflow-hidden")}>
      <div
        className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your subscription, payment method, and invoices.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15 dark:border-primary/35 dark:bg-primary/15 dark:text-primary-200 dark:hover:bg-primary/20"
        >
          <Sparkles className="h-4 w-4" />
          View all plans
        </Link>
      </div>

      {/* Current plan */}
      <section className={HERO_SECTION}>
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Current Plan</h2>
              <p className="mt-1 text-2xl font-bold text-foreground">{sub?.plan?.name ?? "Free"}</p>
              {sub && statusBadge(sub.status)}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {(summary?.promotion?.finalAmount != null || summary?.amount != null) && (
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(
                  Number(summary.promotion?.finalAmount ?? summary.amount),
                  sub?.plan?.currency
                )}
                <span className="text-sm font-normal text-muted-foreground">
                  /{sub?.billingInterval === "YEARLY" ? "year" : "month"}
                </span>
              </p>
            )}
            {summary?.nextBillingDate && (
              <p>Next billing: {new Date(summary.nextBillingDate).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {sub?.status === "TRIALING" && summary?.trialDaysRemaining != null && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-4 dark:border-primary/30 dark:bg-primary/15">
            <p className="font-medium text-primary dark:text-primary-200">
              Trial: {summary.trialDaysRemaining} day{summary.trialDaysRemaining === 1 ? "" : "s"} remaining
            </p>
            {sub.trialEnd && (
              <p className="text-sm text-primary/80 dark:text-primary-300/90">
                Ends {new Date(sub.trialEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {summary?.promotion && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10">
            <p className="text-sm font-semibold text-primary dark:text-primary-200">Active promotion</p>
            <p className="mt-1 font-mono text-sm text-primary/90 dark:text-primary-300">{summary.promotion.code}</p>
            {summary.promotion.name && (
              <p className="text-sm text-muted-foreground">{summary.promotion.name}</p>
            )}
            {summary.promotion.discountAmount != null && summary.promotion.discountAmount > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                You save {formatCurrency(summary.promotion.discountAmount, sub?.plan?.currency)} per cycle
              </p>
            )}
            {summary.promotion.validUntil && (
              <p className="mt-1 text-xs text-muted-foreground">
                Expires {new Date(summary.promotion.validUntil).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {(summary?.promotion?.originalAmount != null || summary?.amount != null) && (
          <div className="relative mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {summary.promotion?.originalAmount != null && (
              <div className="rounded-xl border border-border/80 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Original</p>
                <p className="mt-1 font-semibold text-foreground">
                  {formatCurrency(summary.promotion.originalAmount, sub?.plan?.currency)}
                </p>
              </div>
            )}
            {summary.promotion?.finalAmount != null && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/15">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Current
                </p>
                <p className="mt-1 font-semibold text-emerald-800 dark:text-emerald-200">
                  {formatCurrency(summary.promotion.finalAmount, sub?.plan?.currency)}
                </p>
              </div>
            )}
            {summary.nextBillingDate && (
              <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 dark:border-primary/30 dark:bg-primary/15">
                <p className="text-xs font-medium uppercase tracking-wide text-primary dark:text-primary-300">
                  Next bill
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {new Date(summary.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="relative mt-4 flex flex-wrap gap-2">
          <Button
            className="shadow-sm"
            onClick={() => {
              setActionError(null);
              if (sub?.billingInterval) setInterval(sub.billingInterval);
              setShowUpgrade(true);
            }}
          >
            {sub ? "Change Plan" : "Upgrade"}
          </Button>
          {sub && !sub.cancelAtPeriodEnd && (
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              disabled={actionLoading}
            >
              Cancel Subscription
            </Button>
          )}
          {sub?.cancelAtPeriodEnd && (
            <Button variant="outline" onClick={handleResume} disabled={actionLoading}>
              Resume Subscription
            </Button>
          )}
        </div>
        {actionError && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive dark:text-red-400">
            {actionError}
          </p>
        )}
      </section>

      {/* Payment method */}
      <section className={SECTION_CARD}>
        <SectionTitle icon={Wallet} title="Payment Method" />
        {pm ? (
          <p className="mb-4 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-foreground dark:border-primary/30 dark:bg-primary/10">
            <CreditCard className="h-4 w-4 text-primary" />
            {(pm.cardBrand ?? "Card").toUpperCase()} •••• {pm.cardLast4}
            {pm.cardExpMonth && pm.cardExpYear && (
              <span className="text-muted-foreground">
                {" "}
                (exp {pm.cardExpMonth}/{pm.cardExpYear})
              </span>
            )}
          </p>
        ) : (
          <p className="mb-4 text-muted-foreground">No payment method on file.</p>
        )}
        <Elements stripe={stripePromise}>
          <PaymentMethodForm onSuccess={refresh} />
        </Elements>
      </section>

      {/* Invoices */}
      <section className={SECTION_CARD}>
        <SectionTitle icon={FileText} title="Invoices" />
        {summary?.invoices?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground dark:border-white/10">
                  <th className="pb-2">Invoice</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.invoices.map((inv: { id: string; invoiceNumber: string; createdAt: string; amount: number; currency: string; status: string }) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 dark:border-white/10">
                    <td className="py-2 text-foreground">{inv.invoiceNumber}</td>
                    <td className="py-2 text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 text-foreground">{formatCurrency(Number(inv.amount), inv.currency)}</td>
                    <td className="py-2 text-muted-foreground">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">No invoices yet.</p>
        )}
      </section>

      {/* Payment history */}
      <section className={SECTION_CARD}>
        <SectionTitle icon={Receipt} title="Payment History" />
        {summary?.payments?.length ? (
          <div className="space-y-2">
            {summary.payments.map((p: { id: string; description?: string; amount: number; currency: string; status: string }) => (
              <div
                key={p.id}
                className="flex justify-between border-b border-border py-2 text-sm last:border-0 dark:border-white/10"
              >
                <span className="text-muted-foreground">{p.description ?? "Payment"}</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(Number(p.amount), p.currency)} — {p.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No payments yet.</p>
        )}
      </section>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className={cn(
              "max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl",
              APP_GLASS_CARD,
              "border-primary/25 bg-background dark:border-primary/35 dark:bg-gray-900/95"
            )}
          >
            <div className="mb-5 flex items-center justify-between border-b border-border/80 pb-4 dark:border-white/10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Upgrade</p>
                <h3 className="text-lg font-bold text-foreground">Choose a Plan</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgrade(false)}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-5 inline-flex rounded-xl border border-border bg-card/80 p-1 dark:border-white/10 dark:bg-white/5">
              <Button
                type="button"
                size="sm"
                variant={interval === "MONTHLY" ? "default" : "ghost"}
                onClick={() => setInterval("MONTHLY")}
                className="rounded-lg"
              >
                Monthly
              </Button>
              <Button
                type="button"
                size="sm"
                variant={interval === "YEARLY" ? "default" : "ghost"}
                onClick={() => setInterval("YEARLY")}
                className="rounded-lg"
              >
                Yearly
              </Button>
            </div>
            <div className="space-y-3">
              {plans
                .filter((p) => p.isPublic && p.name !== "Free")
                .map((plan) => {
                  const isCurrent = sub?.plan?.id === plan.id;
                  const isPopular = plan.isPopular;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanSelect(plan)}
                      disabled={actionLoading || isCurrent}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left transition",
                        isPopular
                          ? "border-primary/45 bg-gradient-to-r from-primary/10 to-transparent shadow-sm ring-1 ring-primary/20 dark:from-primary/15"
                          : "border-border hover:border-primary/35 dark:border-white/10",
                        isCurrent && "border-primary bg-primary/10 dark:bg-primary/15"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{plan.name}</span>
                            {isPopular && (
                              <Badge className="border-0 bg-primary text-primary-foreground text-[10px]">
                                Popular
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge variant="outline" className="text-[10px]">
                                Current
                              </Badge>
                            )}
                          </div>
                          {plan.trialEnabled && (
                            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {plan.trialDurationDays}-day free trial
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-foreground">
                          {formatCurrency(
                            interval === "YEARLY" ? Number(plan.yearlyPrice) : Number(plan.monthlyPrice),
                            plan.currency
                          )}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{interval === "YEARLY" ? "yr" : "mo"}
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <SubscriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        plan={modalPlan}
        interval={interval}
        onIntervalChange={setInterval}
        onSuccess={refresh}
      />

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="border-border bg-background dark:border-white/10 dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your plan will stay active until the end of the current billing period on{" "}
              {summary?.nextBillingDate
                ? new Date(summary.nextBillingDate).toLocaleDateString()
                : "the next billing date"}
              . You can resume anytime before then.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Canceling..." : "Cancel at period end"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
