import { useState, useEffect, useCallback } from "react";
import { Payout, PayoutFilters } from "../app/types/payout";
import { apiService } from "../shared";
import { toNumber } from "../utils/currency";

interface PayoutQueryParams extends PayoutFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UsePayoutsResult {
  payouts: Payout[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<PayoutQueryParams>) => void;
  filters: PayoutQueryParams;
}

const usePayouts = (
  initialFilters: PayoutQueryParams = {}
): UsePayoutsResult => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<PayoutQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "scheduledAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use real API
      const response = await apiService.getPayouts(filters);

      if (response && response.data) {
        setPayouts(response.data);
        setPagination(response.pagination);
      } else {
        setPayouts([]);
        setPagination({
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: 0,
          totalPages: 0,
        });
      }
    } catch (err) {
      console.error("Error fetching payouts:", err);

      setError(err instanceof Error ? err.message : "Failed to fetch payouts");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const updateFilters = useCallback(
    (newFilters: Partial<PayoutQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return {
    payouts,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default usePayouts;
