import { useState, useEffect, useCallback } from "react";
import { SubscriptionPackagesService } from "../app/services/subscriptions/subscription-packages.service";
import {
  SubscriptionPackage,
  SubscriptionPackageQueryParams,
  SubscriptionPackageFilters,
} from "../app/types/subscription";

interface UseSubscriptionPackagesResult {
  packages: SubscriptionPackage[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<SubscriptionPackageFilters>) => void;
  filters: SubscriptionPackageQueryParams;
}

const useSubscriptionPackages = (
  initialFilters: SubscriptionPackageQueryParams = {}
): UseSubscriptionPackagesResult => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<SubscriptionPackageQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const packagesService = new SubscriptionPackagesService();

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await packagesService.getPackages(filters);

      // Handle both PaginatedResponse and SubscriptionPackage[] return types
      if (Array.isArray(response)) {
        setPackages(response);
        setPagination(null);
      } else {
        setPackages(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subscription packages"
      );
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const updateFilters: (newFilters: Partial<SubscriptionPackageFilters>) => void = useCallback(
    (newFilters: Partial<SubscriptionPackageFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters } as SubscriptionPackageQueryParams));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchPackages();
  }, [fetchPackages]);

  return {
    packages,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useSubscriptionPackages;

