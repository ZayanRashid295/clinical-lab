"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { PricingCard } from "./PricingCard";
import { SubscriptionPackagesService } from "@/app/services/subscriptions/subscription-packages.service";
import type { SubscriptionPackage } from "@/app/types/subscription";

interface PricingCarouselProps {
  onPackageSelect: (packageId: string) => void;
  onContactSales: () => void;
}

function formatPrice(pkg: SubscriptionPackage): string {
  const p = parseFloat(String(pkg.price ?? 0));
  if (p === 0) return "Custom";
  const currency = pkg.currency === "USD" || !pkg.currency ? "$" : `${pkg.currency} `;
  return `${currency}${p.toFixed(p % 1 === 0 ? 0 : 2)}`;
}

function formatPeriod(pkg: SubscriptionPackage): string {
  const days = pkg.validityDays ?? 30;
  if (days >= 365) return "year";
  if (days >= 28) return "month";
  return `${days} days`;
}

function packageFeatures(pkg: SubscriptionPackage): string[] {
  const fromApi =
    pkg.subscriptionFeatures
      ?.map((f) => f.packageFeature?.name)
      .filter((n): n is string => Boolean(n)) ?? [];
  if (fromApi.length > 0) return fromApi.slice(0, 8);
  return [
    "Full MedPrepAI platform access",
    "AI patient simulations",
    "Progress tracking & analytics",
  ];
}

function packageCta(pkg: SubscriptionPackage): string {
  const p = parseFloat(String(pkg.price ?? 0));
  const name = (pkg.name ?? "").toLowerCase();
  if (p === 0 || name.includes("institution") || name.includes("enterprise")) {
    return "Contact sales";
  }
  return "Get started";
}

export function PricingCarousel({
  onPackageSelect,
  onContactSales,
}: PricingCarouselProps) {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const packagesService = useMemo(() => new SubscriptionPackagesService(), []);

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
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await packagesService.getPackages({ status: "ACTIVE" });
        const list = Array.isArray(response) ? response : (response?.data ?? []);
        const sorted = [...list].sort(
          (a, b) =>
            parseFloat(String(a.price ?? 0)) - parseFloat(String(b.price ?? 0)),
        );
        setPackages(sorted);
      } catch {
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchPackages();
  }, [packagesService]);

  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, packages.length]);

  const popularIndex =
    packages.length >= 2 ? Math.min(1, packages.length - 1) : -1;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
        <p className="text-lg text-slate-300">Plans coming soon</p>
        <p className="mt-2 text-sm text-slate-500">
          Your administrator can publish subscription packages from the admin
          console.
        </p>
        <button
          type="button"
          onClick={onContactSales}
          className="mt-6 text-sm font-medium text-primary-400 hover:text-primary-300"
        >
          Contact us for institutional pricing →
        </button>
      </div>
    );
  }

  const slideCount = emblaApi?.scrollSnapList().length ?? packages.length;

  return (
    <div className="relative">
      <div className="overflow-hidden pt-2" ref={emblaRef}>
        <div className="flex touch-pan-y items-stretch">
          {packages.map((pkg, index) => {
            const isPopular = index === popularIndex && packages.length > 1;
            const cta = packageCta(pkg);
            const isContact = cta === "Contact sales";
            return (
              <div
                key={pkg.id}
                className="flex h-full min-w-0 flex-[0_0_100%] flex-col px-2 sm:flex-[0_0_50%] sm:px-3 lg:flex-[0_0_33.333%]"
              >
                <PricingCard
                  name={pkg.name}
                  price={formatPrice(pkg)}
                  period={formatPeriod(pkg)}
                  description={pkg.description ?? ""}
                  features={packageFeatures(pkg)}
                  popular={isPopular}
                  cta={cta}
                  packageId={pkg.id}
                  onSelect={() =>
                    isContact ? onContactSales() : onPackageSelect(pkg.id)
                  }
                  variant="dark"
                />
              </div>
            );
          })}
        </div>
      </div>

      {packages.length > 3 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canPrev}
            className={cn(
              "absolute -left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-900/90 text-white shadow-lg backdrop-blur transition hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-30 lg:-left-14",
            )}
            aria-label="Previous plans"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canNext}
            className={cn(
              "absolute -right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-900/90 text-white shadow-lg backdrop-blur transition hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-30 lg:-right-14",
            )}
            aria-label="Next plans"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {slideCount > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === selectedIndex
                  ? "w-8 bg-primary-500"
                  : "w-2 bg-white/25 hover:bg-white/40",
              )}
              aria-label={`Go to plan group ${i + 1}`}
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        Showing {packages.length} plan{packages.length === 1 ? "" : "s"} · swipe
        or use arrows to browse
      </p>
    </div>
  );
}
