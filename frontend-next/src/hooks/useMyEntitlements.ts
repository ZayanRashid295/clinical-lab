import { useCallback, useEffect, useMemo, useState } from "react";
import { SubscriptionsService } from "../app/services/subscriptions/subscriptions.service";
import { getApiErrorMessage } from "../app/services/base/api-http-error";

export default function useMyEntitlements() {
  const service = useMemo(() => new SubscriptionsService(), []);
  const [entitlements, setEntitlements] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await service.getMyEntitlements();
      setEntitlements(resp || {});
    } catch (e) {
      setError(getApiErrorMessage(e, "Failed to load entitlements"));
      setEntitlements({});
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    load();
  }, [load]);

  return { entitlements, loading, error, refetch: load };
}

