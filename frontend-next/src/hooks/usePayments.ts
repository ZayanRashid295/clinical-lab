import { useState, useEffect, useCallback } from "react";
import { Payment, PaymentFilters } from "../app/types/payment";
import { paymentsService } from "../app/services/payments/payments.service";
import { PaymentQueryParams } from "../app/services/payments/payments.types";

interface UsePaymentsResult {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<PaymentQueryParams>) => void;
  filters: PaymentQueryParams;
}

const usePayments = (
  initialFilters: PaymentQueryParams = {}
): UsePaymentsResult => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<PaymentQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await paymentsService.getPayments(filters);

      // Handle both PaginatedResponse and Payment[] return types
      if (Array.isArray(response)) {
        setPayments(response);
        setPagination(null);
      } else {
        setPayments(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const updateFilters = useCallback(
    (newFilters: Partial<PaymentQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default usePayments;
