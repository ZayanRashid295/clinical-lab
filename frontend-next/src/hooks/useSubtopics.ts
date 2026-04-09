import { useState, useEffect, useCallback, useMemo } from "react";
import { SubtopicsService } from "../app/services/content/subtopics.service";
import { Subtopic, SubtopicQueryParams } from "../app/types/content";

interface UseSubtopicsResult {
  subtopics: Subtopic[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<SubtopicQueryParams>) => void;
  filters: SubtopicQueryParams;
}

const useSubtopics = (
  initialFilters: SubtopicQueryParams = {}
): UseSubtopicsResult => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<SubtopicQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "order",
    sortOrder: "asc",
    ...initialFilters,
  });

  const service = useMemo(() => new SubtopicsService(), []);

  const fetchSubtopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await service.getSubtopics(filters);

      if (Array.isArray(response)) {
        setSubtopics(response);
        setPagination(null);
      } else {
        setSubtopics(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subtopics"
      );
      setSubtopics([]);
    } finally {
      setLoading(false);
    }
  }, [service, filters]);

  useEffect(() => {
    fetchSubtopics();
  }, [fetchSubtopics]);

  const updateFilters = useCallback(
    (newFilters: Partial<SubtopicQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchSubtopics();
  }, [fetchSubtopics]);

  return {
    subtopics,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useSubtopics;
