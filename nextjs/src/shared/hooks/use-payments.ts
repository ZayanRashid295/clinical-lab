"use client";

import { useState, useEffect, useCallback } from "react";
import { Payment, PaymentFilters, PaginatedResponse } from "../types/payment";
import { paymentsService } from "../services/payments.service";

interface UsePaymentsOptions {
  page?: number;
  limit?: number;
  initialFilters?: PaymentFilters;
}

interface UsePaymentsReturn {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  filters: PaymentFilters;
  refetch: () => Promise<void>;
  updateFilters: (newFilters: Partial<PaymentFilters>) => void;
  clearFilters: () => void;
}

export function usePayments(
  options: UsePaymentsOptions = {}
): UsePaymentsReturn {
  const { page = 1, limit = 10, initialFilters = {} } = options;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({
    page,
    limit,
    ...initialFilters,
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentsService.getPayments(filters);

      if (Array.isArray(response)) {
        // If response is a simple array, create pagination info
        setPayments(response);
        setPagination({
          page: 1,
          limit: response.length,
          total: response.length,
          totalPages: 1,
        });
      } else {
        // If response is paginated
        const paginatedResponse = response as PaginatedResponse<Payment>;
        setPayments(paginatedResponse.data);
        setPagination(paginatedResponse.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch payments");
      setPayments([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<PaymentFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Reset to page 1 when filters change
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit,
    });
  }, [limit]);

  const refetch = useCallback(async () => {
    await fetchPayments();
  }, [fetchPayments]);

  // Fetch payments when filters change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    pagination,
    filters,
    refetch,
    updateFilters,
    clearFilters,
  };
}

export default usePayments;
