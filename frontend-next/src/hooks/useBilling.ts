import { useCallback, useEffect, useState } from "react";
import { billingService, BillingSummary, BillingPlan } from "@/app/services/billing/billing.service";

export function useBilling() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await billingService.getMyBilling();
      setSummary(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}

export function useBillingPlans(publicOnly = true) {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = publicOnly
          ? await billingService.getPublicPlans()
          : await billingService.getAdminPlans();
        setPlans(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [publicOnly]);

  return { plans, loading };
}
