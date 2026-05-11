"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import useMyEntitlements from "@/hooks/useMyEntitlements";
import { isMedprepSlugAllowed } from "@/lib/fyp/medprep-entitlements";

type MedPrepSlugGateProps = {
  /** Route id from `modes.ts`, e.g. `qa`, `let-me-drive`, `ai-evaluation`. */
  slug: string;
  /** Display name for copy, e.g. "Learning Mode". */
  modeLabel: string;
  children: React.ReactNode;
};

/**
 * Blocks MedPrep routes when the subscription omits `medprepai.access` or the mode slug in `medprepai.modes`.
 */
export function MedPrepSlugGate({ slug, modeLabel, children }: MedPrepSlugGateProps) {
  const { entitlements, loading } = useMyEntitlements();
  const hasMedprepModuleAccess = Boolean(
    entitlements["medprepai.access"]?.enabled ??
      entitlements["medprepai.access"] ??
      false
  );
  const modeAllowed = isMedprepSlugAllowed(
    entitlements as Record<string, unknown>,
    slug,
    hasMedprepModuleAccess
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-gray-50 p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!hasMedprepModuleAccess || !modeAllowed) {
    return (
      <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-gray-50 p-8">
        <div className="max-w-lg space-y-4 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            {!hasMedprepModuleAccess
              ? "MedPrepAI isn’t included on your current plan"
              : `${modeLabel} isn’t included on your current plan`}
          </h1>
          <p className="text-sm leading-relaxed text-gray-600">
            {!hasMedprepModuleAccess
              ? "Upgrade to unlock MedPrepAI modes and case practice."
              : `Your subscription lists other MedPrep modes, but not ${modeLabel}. Choose an included mode from MedPrep home, or upgrade your plan.`}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link href="/my-subscription">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                View plans and subscription
              </Button>
            </Link>
            <Link href="/medprep-ai">
              <Button variant="outline">MedPrep home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
