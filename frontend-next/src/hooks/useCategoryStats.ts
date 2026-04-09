import { useState, useEffect, useCallback, useMemo } from "react";
import { CategoriesService } from "../app/services/categories/categories.service";

interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseCategoryStatsResult {
  stats: CategoryStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useCategoryStats = (): UseCategoryStatsResult => {
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoriesService = useMemo(() => new CategoriesService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesService.getCategoryStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch category stats"
      );
    } finally {
      setLoading(false);
    }
  }, [categoriesService]);

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

export default useCategoryStats;
