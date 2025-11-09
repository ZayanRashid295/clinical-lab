import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductsService } from "../app/services/products/products.service";
import { Product, ProductQueryParams } from "../app/types/product";

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<ProductQueryParams>) => void;
  filters: ProductQueryParams;
}

const useProducts = (
  initialFilters: ProductQueryParams = {}
): UseProductsResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<ProductQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const productsService = useMemo(() => new ProductsService(), []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productsService.getProducts(filters);

      // Handle both PaginatedResponse and Product[] return types
      if (Array.isArray(response)) {
        setProducts(response);
        setPagination(null);
      } else {
        setProducts(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch products"
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [productsService, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilters = useCallback(
    (newFilters: Partial<ProductQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useProducts;

