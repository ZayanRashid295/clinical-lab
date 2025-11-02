import { useState, useEffect, useCallback, useMemo } from "react";
import { ChaptersService } from "../app/services/content/chapters.service";
import { Chapter, ChapterQueryParams } from "../app/types/content";

interface UseChaptersResult {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<ChapterQueryParams>) => void;
  filters: ChapterQueryParams;
}

const useChapters = (
  initialFilters: ChapterQueryParams = {}
): UseChaptersResult => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<ChapterQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "order",
    sortOrder: "asc",
    ...initialFilters,
  });

  const chaptersService = useMemo(() => new ChaptersService(), []);

  const fetchChapters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await chaptersService.getChapters(filters);

      if (Array.isArray(response)) {
        setChapters(response);
        setPagination(null);
      } else {
        setChapters(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch chapters"
      );
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, [chaptersService, filters]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const updateFilters = useCallback(
    (newFilters: Partial<ChapterQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchChapters();
  }, [fetchChapters]);

  return {
    chapters,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useChapters;

