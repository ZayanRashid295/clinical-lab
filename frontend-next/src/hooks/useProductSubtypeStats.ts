import { useState, useEffect } from "react";
import { ProductSubtypesService } from "../app/services/products/product-subtypes.service";

interface ProductSubtypeStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseProductSubtypeStatsResult {
  stats: ProductSubtypeStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useProductSubtypeStats = (): UseProductSubtypeStatsResult => {
  const [stats, setStats] = useState<ProductSubtypeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subtypesService = new ProductSubtypesService();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subtypesService.getSubtypeStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subtype stats"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

export default useProductSubtypeStats;

