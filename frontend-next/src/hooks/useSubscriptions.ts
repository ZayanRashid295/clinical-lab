import { useState, useEffect, useCallback, useMemo } from "react";
import { SubscriptionsService } from "../app/services/subscriptions/subscriptions.service";
import {
  Subscription,
  SubscriptionQueryParams,
  SubscriptionFilters,
} from "../app/types/subscription";

interface UseSubscriptionsResult {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<SubscriptionFilters>) => void;
  filters: SubscriptionQueryParams;
}

const useSubscriptions = (
  initialFilters: SubscriptionQueryParams = {}
): UseSubscriptionsResult => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<SubscriptionQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const subscriptionsService = useMemo(() => new SubscriptionsService(), []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionsService.getSubscriptions(filters);

      // Handle both PaginatedResponse and Subscription[] return types
      if (Array.isArray(response)) {
        setSubscriptions(response);
        setPagination(null);
      } else {
        setSubscriptions(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subscriptions"
      );
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [subscriptionsService, filters]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const updateFilters: (newFilters: Partial<SubscriptionFilters>) => void = useCallback(
    (newFilters: Partial<SubscriptionFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters } as SubscriptionQueryParams));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return {
    subscriptions,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useSubscriptions;

