import { useState, useEffect, useCallback, useMemo } from "react";
import { CategoriesService } from "../app/services/categories/categories.service";
import { Category, CategoryQueryParams } from "../app/types/category";

interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<CategoryQueryParams>) => void;
  filters: CategoryQueryParams;
}

const useCategories = (
  initialFilters: CategoryQueryParams = {}
): UseCategoriesResult => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<CategoryQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "order",
    sortOrder: "asc",
    ...initialFilters,
  });

  const service = useMemo(() => new CategoriesService(), []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await service.getCategories(filters);

      if (Array.isArray(response)) {
        setCategories(response);
        setPagination(null);
      } else {
        setCategories(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories"
      );
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [service, filters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const updateFilters = useCallback(
    (newFilters: Partial<CategoryQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useCategories;
