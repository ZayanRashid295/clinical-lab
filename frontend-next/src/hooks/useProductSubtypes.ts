import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductSubtypesService } from "../app/services/products/product-subtypes.service";
import {
  ProductSubtype,
  ProductSubtypeQueryParams,
} from "../app/types/product";

interface UseProductSubtypesResult {
  subtypes: ProductSubtype[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<ProductSubtypeQueryParams>) => void;
  filters: ProductSubtypeQueryParams;
}

const useProductSubtypes = (
  initialFilters: ProductSubtypeQueryParams = {}
): UseProductSubtypesResult => {
  const [subtypes, setSubtypes] = useState<ProductSubtype[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<ProductSubtypeQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const subtypesService = useMemo(() => new ProductSubtypesService(), []);

  const fetchSubtypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await subtypesService.getSubtypes(filters);

      // Handle both PaginatedResponse and ProductSubtype[] return types
      if (Array.isArray(response)) {
        setSubtypes(response);
        setPagination(null);
      } else {
        setSubtypes(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch product subtypes"
      );
      setSubtypes([]);
    } finally {
      setLoading(false);
    }
  }, [subtypesService, filters]);

  useEffect(() => {
    fetchSubtypes();
  }, [fetchSubtypes]);

  const updateFilters = useCallback(
    (newFilters: Partial<ProductSubtypeQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchSubtypes();
  }, [fetchSubtypes]);

  return {
    subtypes,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useProductSubtypes;

