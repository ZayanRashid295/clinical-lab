"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useBillingPlans } from "@/hooks/useBilling";
import { BillingInterval, BillingPlan } from "@/app/services/billing/billing.service";
import SubscriptionModal from "./SubscriptionModal";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { APP_GLASS_CARD, APP_PAGE_PADDING, APP_PAGE_SHELL } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export default function PricingPage() {
  const router = useRouter();
  const { plans, loading } = useBillingPlans();
  const [interval, setInterval] = useState<BillingInterval>("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialPromo, setInitialPromo] = useState<string | undefined>();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || loading || !plans.length) return;
    const planId = router.query.planId as string | undefined;
    const qInterval = router.query.interval as BillingInterval | undefined;
    const promo = router.query.promo as string | undefined;
    if (qInterval === "MONTHLY" || qInterval === "YEARLY") {
      setInterval(qInterval);
    }
    if (planId) {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        setInitialPromo(promo);
        setModalOpen(true);
      }
    }
  }, [router.isReady, router.query, loading, plans]);

  const handleSelect = (plan: BillingPlan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className={cn(APP_PAGE_SHELL, APP_PAGE_PADDING, "py-12")}>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-xl border border-border bg-muted/40 dark:border-white/10 dark:bg-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  const visiblePlans = plans.filter((p) => p.isPublic && p.name !== "Free");

  return (
    <div className={cn(APP_PAGE_SHELL, "relative min-h-screen w-full overflow-hidden")}>
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
        aria-hidden
      />

      <div className={cn(APP_PAGE_PADDING, "relative flex min-h-screen w-full flex-col py-10")}>
        <div className="mb-8 shrink-0 text-center sm:mb-10">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm dark:border-primary/40 dark:bg-primary/15 dark:text-primary-200">
            <Sparkles className="h-3.5 w-3.5" />
            Beta pricing available
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Choose a plan and apply a promotion code at checkout. Pay only when your total is
            greater than zero.
          </p>
          <div className="mt-6 inline-flex rounded-xl border border-border bg-card/90 p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
            <Button
              type="button"
              size="sm"
              variant={interval === "MONTHLY" ? "default" : "ghost"}
              onClick={() => setInterval("MONTHLY")}
              className="min-w-[5.5rem] rounded-lg"
            >
              Monthly
            </Button>
            <Button
              type="button"
              size="sm"
              variant={interval === "YEARLY" ? "default" : "ghost"}
              onClick={() => setInterval("YEARLY")}
              className="min-w-[5.5rem] rounded-lg"
            >
              Yearly
            </Button>
          </div>
        </div>

        <div className="grid w-full flex-1 grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {visiblePlans.map((plan) => {
            const price =
              interval === "YEARLY" ? Number(plan.yearlyPrice) : Number(plan.monthlyPrice);
            const features = Array.isArray(plan.featuresJson) ? plan.featuresJson : [];
            const isHovered = hoveredId === plan.id;
            const isPopular = plan.isPopular;

            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHoveredId(plan.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  "relative flex h-full min-h-0 flex-col rounded-2xl border p-5 transition-all duration-200 sm:p-6",
                  APP_GLASS_CARD,
                  isPopular
                    ? cn(
                        "border-primary/50 bg-gradient-to-b from-primary/[0.12] via-white/95 to-white/90",
                        "shadow-lg shadow-primary/15 ring-1 ring-primary/25",
                        "dark:from-primary/20 dark:via-white/[0.07] dark:to-white/[0.04]",
                        "dark:border-primary/45 dark:shadow-primary/20 dark:ring-primary/30"
                      )
                    : cn(
                        "border-border bg-white/90 dark:border-white/10 dark:bg-white/5",
                        "hover:border-primary/25 dark:hover:border-primary/35"
                      ),
                  isHovered && "shadow-xl lg:-translate-y-1"
                )}
              >
                {/* In-card badge row — keeps alignment and avoids clipping */}
                <div className="mb-3 flex h-8 shrink-0 items-center justify-center">
                  <Badge
                    className={cn(
                      "rounded-full border-0 bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-md",
                      !isPopular && "pointer-events-none invisible"
                    )}
                    aria-hidden={!isPopular}
                  >
                    Most popular
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-foreground sm:text-xl">{plan.name}</h3>
                <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{plan.description}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {formatCurrency(price, plan.currency)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    /{interval === "YEARLY" ? "year" : "mo"}
                  </span>
                </div>

                {plan.trialEnabled && (
                  <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:text-sm">
                    {plan.trialDurationDays}-day free trial available
                  </p>
                )}

                <ul className="mt-6 flex-1 space-y-2.5 border-t border-border/80 pt-5 dark:border-white/10">
                  {features.map((f) => (
                    <li key={f.key} className="flex items-start gap-2.5 text-sm text-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 dark:bg-primary/25">
                        <Check className="h-3 w-3 text-primary dark:text-primary-300" />
                      </span>
                      {f.name}
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  size="lg"
                  variant={isPopular ? "default" : "outline"}
                  className={cn(
                    "mt-6 w-full font-semibold shadow-sm",
                    !isPopular &&
                      "border-primary/30 bg-background hover:border-primary/50 hover:bg-primary/5 dark:border-primary/35 dark:hover:bg-primary/10"
                  )}
                  onClick={() => handleSelect(plan)}
                >
                  Get started
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <SubscriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        plan={selectedPlan}
        interval={interval}
        onIntervalChange={setInterval}
        initialPromotionCode={initialPromo}
      />
    </div>
  );
}
