import { useState, useEffect, useCallback, useMemo } from "react";
import { EntitlementDefinitionsService } from "../app/services/subscriptions/entitlement-definitions.service";

interface EntitlementStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseEntitlementDefinitionStatsResult {
  stats: EntitlementStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useEntitlementDefinitionStats = (): UseEntitlementDefinitionStatsResult => {
  const [stats, setStats] = useState<EntitlementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(() => new EntitlementDefinitionsService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await service.getDefinitionStats();
      setStats(resp);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch entitlement stats"
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch };
};

export default useEntitlementDefinitionStats;

