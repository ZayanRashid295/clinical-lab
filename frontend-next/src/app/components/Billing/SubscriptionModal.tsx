"use client";

import React, { useCallback, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { X, Check, Loader2, Sparkles, Tag, Crown } from "lucide-react";
import { useRouter } from "next/router";
import {
  billingService,
  BillingInterval,
  BillingPlan,
  PromotionQuote,
} from "@/app/services/billing/billing.service";
import { Button } from "@/shared/ui/button";
import { APP_GLASS_CARD } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function PriceBreakdown({ quote, animating }: { quote: PromotionQuote | null; animating: boolean }) {
  if (!quote) return null;
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-border bg-muted/40 p-4 transition-all duration-200 dark:border-white/10 dark:bg-white/5",
        animating && "scale-[0.98] opacity-70"
      )}
    >
      {quote.lines.map((line) => (
        <div key={line.label} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{line.label}</span>
          <span
            className={cn(
              "font-medium tabular-nums",
              line.amount < 0 ? "text-primary" : "text-foreground"
            )}
          >
            {line.amount < 0 ? "−" : ""}
            {formatCurrency(Math.abs(line.amount), quote.currency)}
          </span>
        </div>
      ))}
      <div className="flex justify-between border-t border-border pt-2 dark:border-white/10">
        <span className="font-semibold text-foreground">Total due today</span>
        <span className="text-lg font-bold tabular-nums text-foreground">
          {formatCurrency(quote.finalAmount, quote.currency)}
        </span>
      </div>
    </div>
  );
}

function PaymentSection({
  planId,
  interval,
  promotionCode,
  onSuccess,
  onError,
}: {
  planId: string;
  interval: BillingInterval;
  promotionCode?: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { clientSecret } = await billingService.createSetupIntent();
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Card element not found");
      const result = await stripe.confirmCardSetup(clientSecret, { payment_method: { card } });
      if (result.error) throw new Error(result.error.message);
      const pmId = result.setupIntent?.payment_method;
      if (typeof pmId !== "string") throw new Error("Card validation failed");
      await billingService.subscribe(planId, interval, {
        paymentMethodId: pmId,
        promotionCode,
      });
      onSuccess();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Payment failed";
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "var(--foreground-color, #111827)",
                "::placeholder": { color: "var(--muted-foreground-color, #6b7280)" },
              },
            },
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Your card will be verified. You will only be charged the discounted amount shown above.
      </p>
      <Button type="button" className="w-full" onClick={handlePay} disabled={loading || !stripe}>
        {loading ? "Processing..." : "Continue to payment"}
      </Button>
    </div>
  );
}

export interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  plan: BillingPlan | null;
  interval: BillingInterval;
  onIntervalChange?: (interval: BillingInterval) => void;
  initialPromotionCode?: string;
  onSuccess?: () => void;
}

export default function SubscriptionModal({
  open,
  onClose,
  plan,
  interval,
  onIntervalChange,
  initialPromotionCode,
  onSuccess,
}: SubscriptionModalProps) {
  const router = useRouter();
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | undefined>();
  const [quote, setQuote] = useState<PromotionQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [priceAnimating, setPriceAnimating] = useState(false);

  const loadQuote = useCallback(
    async (code?: string) => {
      if (!plan) return;
      setQuoteLoading(true);
      setPromoError(null);
      try {
        const result = await billingService.getPromotionQuote(plan.id, interval, code);
        setQuote(result);
        if (result.error) {
          setPromoError(result.error);
          setAppliedCode(undefined);
        } else if (code) {
          setAppliedCode(code);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Could not validate promotion";
        setPromoError(message);
      } finally {
        setQuoteLoading(false);
      }
    },
    [plan, interval]
  );

  useEffect(() => {
    if (open && plan) {
      const code = initialPromotionCode?.trim().toUpperCase();
      setPromoInput(code ?? "");
      setAppliedCode(undefined);
      setPromoError(null);
      setSubmitError(null);
      loadQuote(code || undefined);
    }
  }, [open, plan, interval, loadQuote, initialPromotionCode]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPriceAnimating(true);
    await loadQuote(promoInput.trim().toUpperCase());
    setTimeout(() => setPriceAnimating(false), 200);
  };

  const handleFreeActivate = async () => {
    if (!plan || !quote) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await billingService.subscribe(plan.id, interval, {
        promotionCode: appliedCode,
      });
      onClose();
      onSuccess?.();
      if (!onSuccess) router.push("/billing?subscribed=1");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not activate subscription";
      setSubmitError(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!open || !plan) return null;

  const features = Array.isArray(plan.featuresJson) ? plan.featuresJson : [];
  const isFreeCheckout = quote && !quote.requiresPayment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200",
          APP_GLASS_CARD,
          "bg-background dark:bg-gray-900/95"
        )}
      >
        <div className="border-b border-primary/15 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 py-5 dark:border-primary/25 dark:from-primary/25 dark:via-primary/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Subscribe</p>
                <h2 className="mt-0.5 text-xl font-bold text-foreground">{plan.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{plan.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {onIntervalChange && (
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1 dark:border-white/10 dark:bg-white/5">
              {(["MONTHLY", "YEARLY"] as BillingInterval[]).map((iv) => (
                <Button
                  key={iv}
                  type="button"
                  size="sm"
                  variant={interval === iv ? "default" : "ghost"}
                  onClick={() => onIntervalChange(iv)}
                  className="rounded-md text-xs"
                >
                  {iv === "MONTHLY" ? "Monthly" : "Yearly"}
                </Button>
              ))}
            </div>
          )}

          <ul className="space-y-2">
            {features.slice(0, 6).map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-sm text-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 dark:bg-primary/25">
                  <Check className="h-3 w-3 text-primary dark:text-primary-300" />
                </span>
                {f.name}
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Tag className="h-4 w-4" />
              Promotion code
            </label>
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm uppercase tracking-wide text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/5"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyPromo}
                disabled={quoteLoading || !promoInput.trim()}
              >
                {quoteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>
            {promoError && <p className="text-sm text-destructive dark:text-red-400">{promoError}</p>}
            {appliedCode && !promoError && (
              <p className="flex items-center gap-1.5 text-sm text-primary dark:text-primary-300">
                <Sparkles className="h-4 w-4" />
                Promotion <strong>{appliedCode}</strong> applied
              </p>
            )}
          </div>

          {quoteLoading && !quote ? (
            <div className="h-24 animate-pulse rounded-xl bg-muted/50 dark:bg-white/5" />
          ) : (
            <PriceBreakdown quote={quote} animating={priceAnimating} />
          )}

          {isFreeCheckout && (
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-4 dark:border-primary/35 dark:bg-primary/15">
              <p className="flex items-center gap-2 font-semibold text-primary dark:text-primary-200">
                <Check className="h-5 w-5" />
                Promotion applied successfully
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                No payment method is required because your total today is $0.00.
              </p>
            </div>
          )}

          {quote?.requiresPayment && (
            <Elements stripe={stripePromise}>
              <PaymentSection
                planId={plan.id}
                interval={interval}
                promotionCode={appliedCode}
                onSuccess={() => {
                  onClose();
                  onSuccess?.();
                  if (!onSuccess) router.push("/billing?subscribed=1");
                }}
                onError={setSubmitError}
              />
            </Elements>
          )}

          {submitError && (
            <p className="text-sm text-destructive dark:text-red-400">{submitError}</p>
          )}
        </div>

        <div className="flex gap-3 border-t border-border px-6 py-4 dark:border-white/10">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          {isFreeCheckout && (
            <Button
              type="button"
              className="flex-1"
              onClick={handleFreeActivate}
              disabled={submitLoading || quoteLoading}
            >
              {submitLoading ? "Activating..." : "Activate subscription"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
