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
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "p-8 relative bg-card border-border h-full flex flex-col",
        popular && "border-primary border-2 shadow-lg"
      )}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <Badge 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs font-semibold rounded-full shadow-lg border-2 border-blue-700 whitespace-nowrap"
          >
            Most Popular
          </Badge>
        </div>
      )}

      {/* Header section with fixed height */}
      <div className={cn("mb-6", popular && "mt-2")}>
        <h3 className="text-2xl font-bold mb-3 text-card-foreground min-h-[2rem] flex items-center">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed min-h-[3rem]">
          {description}
        </p>
      </div>

      {/* Price section with fixed height */}
      <div className="mb-6 min-h-[4rem] flex items-end">
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className="text-4xl font-bold text-card-foreground">
            {price}
          </span>
          <span className="text-base text-muted-foreground font-medium">
            /{period}
          </span>
        </div>
      </div>

      {/* Button section - fixed position */}
      <div className="mb-6 min-h-[3.5rem] flex items-center">
        <Button
          className="w-full font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600 shadow-md"
          variant="default"
          onClick={onSelect}
          size="lg"
          data-testid={`button-select-${name.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {cta}
        </Button>
      </div>

      {/* Features section - flexible to fill remaining space */}
      <div className="space-y-3 flex-1">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm text-card-foreground leading-relaxed break-words">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
