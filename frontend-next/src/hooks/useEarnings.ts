import { useState, useEffect, useCallback } from "react";
import { Earnings, EarningsFilters } from "../app/types/payout";
import { apiService } from "../shared";
import { toNumber } from "../utils/currency";

interface EarningsQueryParams extends EarningsFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UseEarningsResult {
  earnings: Earnings[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<EarningsQueryParams>) => void;
  filters: EarningsQueryParams;
}

const useEarnings = (
  initialFilters: EarningsQueryParams = {}
): UseEarningsResult => {
  const [earnings, setEarnings] = useState<Earnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<EarningsQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "calculatedAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use real API
      const response = await apiService.getEarnings(filters);

      if (response && response.data) {
        setEarnings(response.data);
        setPagination(response.pagination);
      } else {
        setEarnings([]);
        setPagination({
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: 0,
          totalPages: 0,
        });
      }
    } catch (err) {
      console.error("Error fetching earnings:", err);

      setError(err instanceof Error ? err.message : "Failed to fetch earnings");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const updateFilters = useCallback(
    (newFilters: Partial<EarningsQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return {
    earnings,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useEarnings;
