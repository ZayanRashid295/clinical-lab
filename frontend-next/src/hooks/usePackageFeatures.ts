import { useState, useEffect, useCallback } from "react";
import { PackageFeaturesService } from "../app/services/subscriptions/package-features.service";
import {
  PackageFeature,
  PackageFeatureQueryParams,
  PackageFeatureFilters,
} from "../app/types/subscription";

interface UsePackageFeaturesResult {
  features: PackageFeature[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<PackageFeatureFilters>) => void;
  filters: PackageFeatureQueryParams;
}

const usePackageFeatures = (
  initialFilters: PackageFeatureQueryParams = {}
): UsePackageFeaturesResult => {
  const [features, setFeatures] = useState<PackageFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<PackageFeatureQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const featuresService = new PackageFeaturesService();

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await featuresService.getFeatures(filters);

      // Handle both PaginatedResponse and PackageFeature[] return types
      if (Array.isArray(response)) {
        setFeatures(response);
        setPagination(null);
      } else {
        setFeatures(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch package features"
      );
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const updateFilters: (newFilters: Partial<PackageFeatureFilters>) => void = useCallback(
    (newFilters: Partial<PackageFeatureFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters } as PackageFeatureQueryParams));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return {
    features,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default usePackageFeatures;

