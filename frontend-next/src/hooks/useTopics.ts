import { useState, useEffect, useCallback, useMemo } from "react";
import { TopicsService } from "../app/services/content/topics.service";
import { Topic, TopicQueryParams } from "../app/types/content";

interface UseTopicsResult {
  topics: Topic[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<TopicQueryParams>) => void;
  filters: TopicQueryParams;
}

const useTopics = (
  initialFilters: TopicQueryParams = {}
): UseTopicsResult => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<TopicQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "order",
    sortOrder: "asc",
    ...initialFilters,
  });

  const topicsService = useMemo(() => new TopicsService(), []);

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await topicsService.getTopics(filters);

      if (Array.isArray(response)) {
        setTopics(response);
        setPagination(null);
      } else {
        setTopics(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch topics"
      );
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [topicsService, filters]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const updateFilters = useCallback(
    (newFilters: Partial<TopicQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchTopics();
  }, [fetchTopics]);

  return {
    topics,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useTopics;
