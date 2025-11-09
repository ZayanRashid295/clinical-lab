import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductsService } from "../app/services/products/products.service";

interface ProductStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseProductStatsResult {
  stats: ProductStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useProductStats = (): UseProductStatsResult => {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productsService = useMemo(() => new ProductsService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsService.getProductStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch product stats"
      );
    } finally {
      setLoading(false);
    }
  }, [productsService]);

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

export default useProductStats;

