import { useState, useEffect, useCallback, useMemo } from "react";
import { EntitlementDefinitionsService } from "../app/services/subscriptions/entitlement-definitions.service";
import {
  EntitlementDefinition,
  EntitlementDefinitionQueryParams,
  EntitlementDefinitionFilters,
} from "../app/types/subscription";

interface UseEntitlementDefinitionsResult {
  definitions: EntitlementDefinition[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<EntitlementDefinitionFilters>) => void;
  filters: EntitlementDefinitionQueryParams;
}

const useEntitlementDefinitions = (
  initialFilters: EntitlementDefinitionQueryParams = {}
): UseEntitlementDefinitionsResult => {
  const [definitions, setDefinitions] = useState<EntitlementDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const [filters, setFilters] = useState<EntitlementDefinitionQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const service = useMemo(() => new EntitlementDefinitionsService(), []);

  const fetchDefinitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await service.getDefinitions(filters);
      if (Array.isArray(resp)) {
        setDefinitions(resp);
        setPagination(null);
      } else {
        setDefinitions(resp.data);
        setPagination(resp.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch entitlements"
      );
      setDefinitions([]);
    } finally {
      setLoading(false);
    }
  }, [service, filters]);

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  const updateFilters: (newFilters: Partial<EntitlementDefinitionFilters>) => void =
    useCallback((newFilters: Partial<EntitlementDefinitionFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters } as any));
    }, []);

  const refetch = useCallback(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  return {
    definitions,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useEntitlementDefinitions;

