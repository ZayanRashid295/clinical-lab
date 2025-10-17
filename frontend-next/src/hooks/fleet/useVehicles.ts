import { useState, useEffect, useCallback } from "react";
import { apiService } from "../../shared/services/api.service";
import { Vehicle, VehicleQueryParams } from "../../app/types/fleet";
import { PaginatedResponse } from "../../app/types/core";
import { MOCK_VEHICLES } from "../../data/mockData";

interface UseVehiclesResult {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (filters: Partial<VehicleQueryParams>) => void;
  filters: VehicleQueryParams;
}

export const useVehicles = (
  initialFilters: VehicleQueryParams = {}
): UseVehiclesResult => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<VehicleQueryParams>({
    page: 1,
    limit: 10,
    ...initialFilters,
  });

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data. In production, this would call the API
      // const response = await apiService.getVehicles(filters);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter mock data based on current filters
      let filteredVehicles = [...MOCK_VEHICLES];

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredVehicles = filteredVehicles.filter(
          (vehicle) =>
            vehicle.make.toLowerCase().includes(searchTerm) ||
            vehicle.model.toLowerCase().includes(searchTerm) ||
            vehicle.licensePlate.toLowerCase().includes(searchTerm) ||
            vehicle.vin.toLowerCase().includes(searchTerm)
        );
      }

      // Apply status filter
      if (filters.status) {
        filteredVehicles = filteredVehicles.filter(
          (vehicle) => vehicle.status === filters.status
        );
      }

      // Apply make filter
      if (filters.make) {
        filteredVehicles = filteredVehicles.filter(
          (vehicle) =>
            vehicle.make.toLowerCase() === filters.make?.toLowerCase()
        );
      }

      // Apply model filter
      if (filters.model) {
        filteredVehicles = filteredVehicles.filter(
          (vehicle) =>
            vehicle.model.toLowerCase() === filters.model?.toLowerCase()
        );
      }

      // Apply year filters
      if (filters.yearFrom) {
        filteredVehicles = filteredVehicles.filter(
          (vehicle) => vehicle.year >= (filters.yearFrom || 0)
        );
      }
      if (filters.yearTo) {
        filteredVehicles = filteredVehicles.filter(
          (vehicle) => vehicle.year <= (filters.yearTo || 9999)
        );
      }

      // Apply mileage filters
      if (filters.mileageFrom) {
        filteredVehicles = filteredVehicles.filter(
          (vehicle) => vehicle.mileage >= (filters.mileageFrom || 0)
        );
      }
      if (filters.mileageTo) {
        filteredVehicles = filteredVehicles.filter(
          (vehicle) => vehicle.mileage <= (filters.mileageTo || 999999)
        );
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

      setVehicles(paginatedVehicles.map(transformVehicle));
      setPagination({
        page,
        limit,
        total: filteredVehicles.length,
        totalPages: Math.ceil(filteredVehicles.length / limit),
      });
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vehicles");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Transform backend vehicle data to frontend format
  const transformVehicle = (backendVehicle: any): Vehicle => {
    return {
      ...backendVehicle,
      // Ensure proper types
      mileage: Number(backendVehicle.mileage) || 0,
      fuelLevel: Number(backendVehicle.fuelLevel) || 0,
      year: Number(backendVehicle.year) || new Date().getFullYear(),
    };
  };

  const updateFilters = useCallback(
    (newFilters: Partial<VehicleQueryParams>) => {
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
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useVehicles;
