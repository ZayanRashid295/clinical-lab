import { useState, useEffect, useCallback } from "react";
import { RolesService } from "../app/services/roles/roles.service";
import { Role, RoleQueryParams, RoleFilters } from "../app/types/user";

interface UseRolesResult {
  roles: Role[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<RoleFilters>) => void;
  filters: RoleQueryParams;
}

const useRoles = (initialFilters: RoleQueryParams = {}): UseRolesResult => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<RoleQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const rolesService = new RolesService();

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rolesService.getRoles(filters);

      // Handle both PaginatedResponse and Role[] return types
      if (Array.isArray(response)) {
        setRoles(response);
        setPagination(null);
      } else {
        setRoles(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch roles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const updateFilters: (newFilters: Partial<RoleFilters>) => void = useCallback((newFilters: Partial<RoleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters } as RoleQueryParams));
  }, []);

  const refetch = useCallback(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useRoles;
