import { useState, useEffect, useCallback } from "react";
import { PackageFeaturesService } from "../app/services/subscriptions/package-features.service";

interface PackageFeatureStats {
  total: number;
  active: number;
  inactive: number;
}

interface UsePackageFeatureStatsResult {
  stats: PackageFeatureStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const usePackageFeatureStats = (): UsePackageFeatureStatsResult => {
  const [stats, setStats] = useState<PackageFeatureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const featuresService = new PackageFeaturesService();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await featuresService.getFeatureStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch package feature stats"
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

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

export default usePackageFeatureStats;

