import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductTagsService } from "../app/services/products/product-tags.service";
import { ProductTag, ProductTagQueryParams } from "../app/types/product";

interface UseProductTagsResult {
  tags: ProductTag[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<ProductTagQueryParams>) => void;
  filters: ProductTagQueryParams;
}

const useProductTags = (
  initialFilters: ProductTagQueryParams = {}
): UseProductTagsResult => {
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<ProductTagQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const tagsService = useMemo(() => new ProductTagsService(), []);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await tagsService.getTags(filters);

      // Handle both PaginatedResponse and ProductTag[] return types
      if (Array.isArray(response)) {
        setTags(response);
        setPagination(null);
      } else {
        setTags(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subjects"
      );
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [tagsService, filters]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const updateFilters = useCallback(
    (newFilters: Partial<ProductTagQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useProductTags;

