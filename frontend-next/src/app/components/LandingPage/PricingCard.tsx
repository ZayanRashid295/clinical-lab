"use client";

import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  packageId?: string;
  onSelect: () => void;
  variant?: "light" | "dark";
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  popular = false,
  cta,
  onSelect,
  variant = "light",
}: PricingCardProps) {
  const isDark = variant === "dark";
  const desc = description?.trim() || "";

  return (
    <Card
      className={cn(
        "relative flex h-full min-h-[420px] flex-col p-6 sm:p-8",
        isDark
          ? "border-white/10 bg-slate-900/60 text-slate-100 backdrop-blur-sm"
          : "border-border bg-card",
        popular &&
          (isDark
            ? "border-primary-500/60 shadow-[0_0_40px_-12px_rgba(var(--color-primary-500-rgb),0.45)] ring-1 ring-primary-500/30"
            : "border-primary border-2 shadow-lg"),
      )}
    >
      {/* Same-height badge slot on every card keeps the row aligned */}
      <div className="mb-4 flex h-9 shrink-0 items-center justify-center">
        <Badge
          className={cn(
            "whitespace-nowrap rounded-full border-2 border-primary-600 bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg",
            !popular && "pointer-events-none invisible",
          )}
          aria-hidden={!popular}
        >
          Most Popular
        </Badge>
      </div>

      <div className="mb-5 shrink-0">
        <h3
          className={cn(
            "line-clamp-2 min-h-[3.25rem] text-2xl font-bold leading-tight",
            isDark ? "text-white" : "text-card-foreground",
          )}
        >
          {name}
        </h3>
        <p
          className={cn(
            "mt-2 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed",
            isDark ? "text-slate-400" : "text-muted-foreground",
            !desc && "invisible",
          )}
        >
          {desc || "\u00a0"}
        </p>
      </div>

      <div className="mb-5 flex min-h-[3.25rem] shrink-0 items-baseline">
        <div className="flex flex-wrap items-baseline gap-1">
          <span
            className={cn(
              "text-4xl font-bold",
              isDark ? "text-white" : "text-card-foreground",
            )}
          >
            {price}
          </span>
          <span
            className={cn(
              "text-base font-medium",
              isDark ? "text-slate-500" : "text-muted-foreground",
            )}
          >
            /{period}
          </span>
        </div>
      </div>

      <div className="mb-5 shrink-0">
        <Button
          className={cn(
            "h-11 w-full border-2 font-semibold shadow-md transition-all",
            isDark
              ? "border-primary-500 bg-primary-600 text-white hover:bg-primary-500"
              : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
          )}
          variant="default"
          onClick={onSelect}
          size="lg"
          data-testid={`button-select-${name.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {cta}
        </Button>
      </div>

      <div className="mt-auto space-y-3 border-t border-white/10 pt-5">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-3.5 w-3.5 text-primary" />
            </div>
            <span
              className={cn(
                "break-words text-sm leading-relaxed",
                isDark ? "text-slate-300" : "text-card-foreground",
              )}
            >
              {feature}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
