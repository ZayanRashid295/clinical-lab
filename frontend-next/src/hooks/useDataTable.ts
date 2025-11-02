import { useState, useEffect, useCallback } from "react";
import { IBaseDataService } from "../app/services/base/base-data.service";
import { PaginatedResponse } from "../app/services/base/api-types";
import { Pagination } from "../shared/components/DataTable/types";

/**
 * Generic hook for data table operations
 * Works with any service that implements IBaseDataService
 */
export interface UseDataTableResult<T, TFilters> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<TFilters>) => void;
  filters: TFilters;
}

export function useDataTable<
  T extends { id: string },
  TFilters extends Record<string, any>
>(
  service: IBaseDataService<T, TFilters>,
  initialFilters?: TFilters
): UseDataTableResult<T, TFilters> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState<TFilters>({
    page: 1,
    limit: 10,
    ...(initialFilters || {}),
  } as unknown as TFilters);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await service.getAll(filters);

      // Handle both PaginatedResponse and T[] return types
      if (Array.isArray(response)) {
        setData(response);
        setPagination(null);
      } else {
        setData((response as PaginatedResponse<T>).data);
        setPagination((response as PaginatedResponse<T>).pagination);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch data";
      setError(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [service, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = useCallback((newFilters: Partial<TFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
}
