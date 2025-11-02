import { useState, useEffect, useCallback, useMemo } from "react";
import { SubscriptionsService } from "../app/services/subscriptions/subscriptions.service";

interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  suspended: number;
  pending: number;
}

interface UseSubscriptionStatsResult {
  stats: SubscriptionStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useSubscriptionStats = (): UseSubscriptionStatsResult => {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscriptionsService = useMemo(() => new SubscriptionsService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionsService.getSubscriptionStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subscription stats"
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [subscriptionsService]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch,
  };
};

export default useSubscriptionStats;

