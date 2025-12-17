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
        "p-8 relative bg-card border-border",
        popular && "border-primary border-2"
      )}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2 text-card-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-card-foreground">
            {price}
          </span>
          <span className="text-muted-foreground">/{period}</span>
        </div>
      </div>

      <Button
        className="w-full mb-6"
        variant={popular ? "default" : "outline"}
        onClick={onSelect}
        data-testid={`button-select-${name.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {cta}
      </Button>

      <div className="space-y-3">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm text-card-foreground">{feature}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
