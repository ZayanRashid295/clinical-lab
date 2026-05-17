"use client";

import { Card } from "@/shared/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03] p-6 transition-all hover:border-primary-500/30 hover:bg-white/[0.06]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/15">
        <Icon className="h-6 w-6 text-primary-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </Card>
  );
}
