import { useState, useEffect, useCallback, useMemo } from "react";
import { SystemsService } from "../app/services/systems/systems.service";
import { System, SystemQueryParams } from "../app/types/content";

interface UseSystemsResult {
  systems: System[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<SystemQueryParams>) => void;
  filters: SystemQueryParams;
}

const useSystems = (
  initialFilters: SystemQueryParams = {}
): UseSystemsResult => {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<SystemQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "order",
    sortOrder: "asc",
    ...initialFilters,
  });

  const service = useMemo(() => new SystemsService(), []);

  const fetchSystems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await service.getSystems(filters);

      if (Array.isArray(response)) {
        setSystems(response);
        setPagination(null);
      } else {
        setSystems(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch systems"
      );
      setSystems([]);
    } finally {
      setLoading(false);
    }
  }, [service, filters]);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const updateFilters = useCallback(
    (newFilters: Partial<SystemQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchSystems();
  }, [fetchSystems]);

  return {
    systems,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useSystems;
