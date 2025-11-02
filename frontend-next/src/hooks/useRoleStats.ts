import { useState, useEffect, useCallback, useMemo } from "react";
import { RolesService } from "../app/services/roles/roles.service";

interface RoleStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseRoleStatsResult {
  stats: RoleStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useRoleStats = (): UseRoleStatsResult => {
  const [stats, setStats] = useState<RoleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rolesService = useMemo(() => new RolesService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rolesService.getRoleStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch role stats"
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [rolesService]);

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

export default useRoleStats;
