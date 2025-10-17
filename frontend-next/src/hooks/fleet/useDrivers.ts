import { useState, useEffect, useCallback } from "react";
import { apiService } from "../../shared/services/api.service";
import { Driver, DriverQueryParams } from "../../app/types/fleet";
import { PaginatedResponse } from "../../app/types/core";
import { MOCK_DRIVERS } from "../../data/mockData";

interface UseDriversResult {
  drivers: Driver[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (filters: Partial<DriverQueryParams>) => void;
  filters: DriverQueryParams;
}

export const useDrivers = (
  initialFilters: DriverQueryParams = {}
): UseDriversResult => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<DriverQueryParams>({
    page: 1,
    limit: 10,
    ...initialFilters,
  });

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data. In production, this would call the API
      // const response = await apiService.getDrivers(filters);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter mock data based on current filters
      let filteredDrivers = [...MOCK_DRIVERS];

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredDrivers = filteredDrivers.filter(
          (driver) =>
            driver.name.toLowerCase().includes(searchTerm) ||
            driver.email.toLowerCase().includes(searchTerm) ||
            driver.phone.includes(searchTerm) ||
            driver.licenseNumber.toLowerCase().includes(searchTerm)
        );
      }

      // Apply status filter
      if (filters.status) {
        filteredDrivers = filteredDrivers.filter(
          (driver) => driver.status === filters.status
        );
      }

      // Apply rating filters
      if (filters.ratingFrom) {
        filteredDrivers = filteredDrivers.filter(
          (driver) => driver.rating >= (filters.ratingFrom || 0)
        );
      }
      if (filters.ratingTo) {
        filteredDrivers = filteredDrivers.filter(
          (driver) => driver.rating <= (filters.ratingTo || 5)
        );
      }

      // Apply rides filters
      if (filters.ridesFrom) {
        filteredDrivers = filteredDrivers.filter(
          (driver) => driver.totalRides >= (filters.ridesFrom || 0)
        );
      }
      if (filters.ridesTo) {
        filteredDrivers = filteredDrivers.filter(
          (driver) => driver.totalRides <= (filters.ridesTo || 999999)
        );
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDrivers = filteredDrivers.slice(startIndex, endIndex);

      setDrivers(paginatedDrivers.map(transformDriver));
      setPagination({
        page,
        limit,
        total: filteredDrivers.length,
        totalPages: Math.ceil(filteredDrivers.length / limit),
      });
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch drivers");
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Transform backend driver data to frontend format
  const transformDriver = (backendDriver: any): Driver => {
    return {
      ...backendDriver,
      // Ensure proper types
      rating: Number(backendDriver.rating) || 0,
      totalRides: Number(backendDriver.totalRides) || 0,
      totalEarnings: Number(backendDriver.totalEarnings) || 0,
    };
  };

  const updateFilters = useCallback(
    (newFilters: Partial<DriverQueryParams>) => {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
        // Reset to page 1 when filters change (except when explicitly setting page)
        page: newFilters.page !== undefined ? newFilters.page : 1,
      }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return {
    drivers,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useDrivers;
