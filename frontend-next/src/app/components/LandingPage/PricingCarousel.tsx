"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { PricingCard } from "./PricingCard";
import { billingService, BillingPlan } from "@/app/services/billing/billing.service";

interface PricingCarouselProps {
  onPackageSelect: (packageId: string) => void;
  onContactSales: () => void;
}

function formatPrice(plan: BillingPlan): string {
  const p = Number(plan.monthlyPrice ?? 0);
  if (p === 0) return "Custom";
  const currency = plan.currency === "USD" || !plan.currency ? "$" : `${plan.currency} `;
  return `${currency}${p.toFixed(p % 1 === 0 ? 0 : 2)}`;
}

function planFeatures(plan: BillingPlan): string[] {
  const features = Array.isArray(plan.featuresJson) ? plan.featuresJson : [];
  if (features.length > 0) return features.map((f) => f.name).slice(0, 8);
  return [
    "Full MedPrepAI platform access",
    "AI patient simulations",
    "Progress tracking & analytics",
  ];
}

function planCta(plan: BillingPlan): string {
  const p = Number(plan.monthlyPrice ?? 0);
  const name = (plan.name ?? "").toLowerCase();
  if (p === 0 || name.includes("institution") || name.includes("enterprise")) {
    return "Contact sales";
  }
  return "Get started";
}

export function PricingCarousel({
  onPackageSelect,
  onContactSales,
}: PricingCarouselProps) {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    billingService
      .getPublicPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const slides = useMemo(() => plans.filter((p) => p.isPublic && p.isActive), [plans]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500">No plans available at the moment.</p>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {slides.map((plan) => (
            <div
              key={plan.id}
              className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%]"
            >
              <PricingCard
                name={plan.name}
                description={plan.description ?? ""}
                price={formatPrice(plan)}
                period="month"
                features={planFeatures(plan)}
                cta={planCta(plan)}
                popular={plan.isPopular}
                onSelect={() => {
                  const p = Number(plan.monthlyPrice ?? 0);
                  const name = (plan.name ?? "").toLowerCase();
                  if (p === 0 || name.includes("institution") || name.includes("enterprise")) {
                    onContactSales();
                  } else {
                    onPackageSelect(plan.id);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canPrev}
            className={cn(
              "absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-white p-2 shadow-md",
              !canPrev && "opacity-40"
            )}
            aria-label="Previous plan"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canNext}
            className={cn(
              "absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-white p-2 shadow-md",
              !canNext && "opacity-40"
            )}
            aria-label="Next plan"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="mt-4 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i === selectedIndex ? "bg-emerald-600" : "bg-gray-300"
                )}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Go to plan ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
