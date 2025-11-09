import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductTagsService } from "../app/services/products/product-tags.service";

interface ProductTagStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseProductTagStatsResult {
  stats: ProductTagStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useProductTagStats = (): UseProductTagStatsResult => {
  const [stats, setStats] = useState<ProductTagStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tagsService = useMemo(() => new ProductTagsService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tagsService.getTagStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch tag stats"
      );
    } finally {
      setLoading(false);
    }
  }, [tagsService]);

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

export default useProductTagStats;

