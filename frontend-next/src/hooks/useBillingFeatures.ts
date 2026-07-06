import { useEffect, useMemo, useState } from "react";
import { billingService } from "@/app/services/billing/billing.service";

export function useBillingFeatures() {
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    billingService
      .getMyFeatures()
      .then((f) => {
        if (!cancelled) setFeatures(f);
      })
      .catch(() => {
        if (!cancelled) setFeatures([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entitlements = useMemo(() => {
    const map: Record<string, { enabled: boolean } | boolean> = {};
    for (const key of features) {
      map[key] = { enabled: true };
    }
    return map;
  }, [features]);

  return { features, entitlements, loading };
}

export default useBillingFeatures;
