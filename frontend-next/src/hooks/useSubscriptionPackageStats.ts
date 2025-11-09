import { useState, useEffect, useCallback, useMemo } from "react";
import { SubscriptionPackagesService } from "../app/services/subscriptions/subscription-packages.service";

interface SubscriptionPackageStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseSubscriptionPackageStatsResult {
  stats: SubscriptionPackageStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useSubscriptionPackageStats = (): UseSubscriptionPackageStatsResult => {
  const [stats, setStats] = useState<SubscriptionPackageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const packagesService = useMemo(() => new SubscriptionPackagesService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await packagesService.getPackageStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch subscription package stats"
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [packagesService]);

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

export default useSubscriptionPackageStats;

