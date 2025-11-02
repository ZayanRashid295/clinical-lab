import { useState, useEffect, useCallback, useMemo } from "react";
import { UsersService } from "../app/services/users/users.service";

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

interface UseUserStatsResult {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useUserStats = (): UseUserStatsResult => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const usersService = useMemo(() => new UsersService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await usersService.getUserStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch user stats"
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [usersService]);

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

export default useUserStats;
