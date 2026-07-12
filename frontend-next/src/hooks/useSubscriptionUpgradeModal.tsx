"use client";

import { useCallback, useState } from "react";
import { SubscriptionUpgradeModal } from "@/shared/components/SubscriptionUpgradeModal";
import { isSubscriptionUpgradeRequiredError } from "@/app/services/base/api-http-error";
import useAccessControl from "@/hooks/useAccessControl";

export const STUDY_FEATURE_KEYS = {
  planner: "study.planner",
  createTest: "qbank.access",
} as const;

export function useSubscriptionUpgradeModal(defaultFeatureLabel?: string) {
  const [open, setOpen] = useState(false);
  const [featureLabel, setFeatureLabel] = useState(defaultFeatureLabel);

  const openUpgrade = useCallback(
    (label?: string) => {
      setFeatureLabel(label ?? defaultFeatureLabel);
      setOpen(true);
    },
    [defaultFeatureLabel]
  );

  const handleSubscriptionError = useCallback(
    (error: unknown, label?: string): boolean => {
      if (isSubscriptionUpgradeRequiredError(error)) {
        openUpgrade(label);
        return true;
      }
      return false;
    },
    [openUpgrade]
  );

  const UpgradeModal = (
    <SubscriptionUpgradeModal
      open={open}
      onOpenChange={setOpen}
      featureLabel={featureLabel}
    />
  );

  return {
    openUpgrade,
    handleSubscriptionError,
    UpgradeModal,
    isOpen: open,
    setOpen,
  };
}

export type EnsureAccessOptions = {
  /** Require an active paid/trial subscription, not only default-plan feature keys. */
  requireSubscription?: boolean;
};

/** Gate a feature by billing entitlement; opens upgrade modal when missing. */
export function useStudyFeatureGate(
  featureKey: string,
  featureLabel: string
) {
  const { hasAccess, loading, hasActiveSubscription } = useAccessControl();
  const upgrade = useSubscriptionUpgradeModal(featureLabel);

  const ensureAccess = useCallback(
    (options?: EnsureAccessOptions): boolean => {
      if (loading) return false;

      if (!hasAccess({ feature: featureKey })) {
        upgrade.openUpgrade();
        return false;
      }

      if (options?.requireSubscription && !hasActiveSubscription) {
        upgrade.openUpgrade();
        return false;
      }

      return true;
    },
    [hasAccess, featureKey, loading, hasActiveSubscription, upgrade]
  );

  return {
    ...upgrade,
    ensureAccess,
    loading,
    hasAccess: hasAccess({ feature: featureKey }),
    hasActiveSubscription,
  };
}
