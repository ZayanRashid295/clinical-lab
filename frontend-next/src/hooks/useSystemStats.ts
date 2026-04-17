import { useState, useEffect, useCallback, useMemo } from "react";
import { SystemsService } from "../app/services/systems/systems.service";

interface SystemStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseSystemStatsResult {
  stats: SystemStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useSystemStats = (): UseSystemStatsResult => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const systemsService = useMemo(() => new SystemsService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await systemsService.getSystemStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch system stats"
      );
    } finally {
      setLoading(false);
    }
  }, [systemsService]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

export default useSystemStats;
