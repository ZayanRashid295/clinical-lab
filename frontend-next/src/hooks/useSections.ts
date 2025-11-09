import { useState, useEffect, useCallback, useMemo } from "react";
import { SectionsService } from "../app/services/content/sections.service";
import { Section, SectionQueryParams } from "../app/types/content";

interface UseSectionsResult {
  sections: Section[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<SectionQueryParams>) => void;
  filters: SectionQueryParams;
}

const useSections = (
  initialFilters: SectionQueryParams = {}
): UseSectionsResult => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<SectionQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "order",
    sortOrder: "asc",
    ...initialFilters,
  });

  const sectionsService = useMemo(() => new SectionsService(), []);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await sectionsService.getSections(filters);

      if (Array.isArray(response)) {
        setSections(response);
        setPagination(null);
      } else {
        setSections(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch sections"
      );
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [sectionsService, filters]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const updateFilters = useCallback(
    (newFilters: Partial<SectionQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchSections();
  }, [fetchSections]);

  return {
    sections,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useSections;

