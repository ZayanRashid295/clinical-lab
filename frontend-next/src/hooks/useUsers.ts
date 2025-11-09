import { useState, useEffect, useCallback, useMemo } from "react";
import { UsersService } from "../app/services/users/users.service";
import { User, UserQueryParams, UserFilters } from "../app/types/user";

interface UseUsersResult {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<UserFilters>) => void;
  filters: UserQueryParams;
}

const useUsers = (initialFilters: UserQueryParams = {}): UseUsersResult => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<UserQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const usersService = useMemo(() => new UsersService(), []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await usersService.getUsers(filters);

      // Handle both PaginatedResponse and User[] return types
      if (Array.isArray(response)) {
        setUsers(response);
        setPagination(null);
      } else {
        setUsers(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [usersService, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateFilters: (newFilters: Partial<UserFilters>) => void = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters } as UserQueryParams));
  }, []);

  const refetch = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useUsers;
