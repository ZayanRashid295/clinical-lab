import { useState, useEffect, useCallback } from "react";
import { apiService } from "../../shared/services/api.service";
import { FuelRecord, FuelQueryParams } from "../../app/types/fleet";
import { PaginatedResponse } from "../../app/types/core";
import { MOCK_FUEL_RECORDS } from "../../data/mockData";

interface UseFuelResult {
  fuelRecords: FuelRecord[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (filters: Partial<FuelQueryParams>) => void;
  filters: FuelQueryParams;
}

export const useFuel = (
  initialFilters: FuelQueryParams = {}
): UseFuelResult => {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<FuelQueryParams>({
    page: 1,
    limit: 10,
    ...initialFilters,
  });

  const fetchFuelRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data. In production, this would call the API
      // const response = await apiService.getFuelRecords(filters);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter mock data based on current filters
      let filteredRecords = [...MOCK_FUEL_RECORDS];

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredRecords = filteredRecords.filter(
          (record) =>
            record.vehicleInfo.toLowerCase().includes(searchTerm) ||
            record.location.toLowerCase().includes(searchTerm) ||
            record.driverName.toLowerCase().includes(searchTerm)
        );
      }

      // Apply vehicle filter
      if (filters.vehicleId) {
        filteredRecords = filteredRecords.filter(
          (record) => record.vehicleId === filters.vehicleId
        );
      }

      // Apply date filters
      if (filters.dateFrom) {
        filteredRecords = filteredRecords.filter(
          (record) => new Date(record.date) >= new Date(filters.dateFrom!)
        );
      }
      if (filters.dateTo) {
        filteredRecords = filteredRecords.filter(
          (record) => new Date(record.date) <= new Date(filters.dateTo!)
        );
      }

      // Apply cost filters
      if (filters.costFrom) {
        filteredRecords = filteredRecords.filter(
          (record) => record.cost >= (filters.costFrom || 0)
        );
      }
      if (filters.costTo) {
        filteredRecords = filteredRecords.filter(
          (record) => record.cost <= (filters.costTo || 999999)
        );
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

      setFuelRecords(paginatedRecords.map(transformFuelRecord));
      setPagination({
        page,
        limit,
        total: filteredRecords.length,
        totalPages: Math.ceil(filteredRecords.length / limit),
      });
    } catch (err) {
      console.error("Error fetching fuel records:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch fuel records"
      );
      setFuelRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Transform backend fuel record data to frontend format
  const transformFuelRecord = (backendRecord: any): FuelRecord => {
    return {
      ...backendRecord,
      // Ensure proper types
      fuelAmount: Number(backendRecord.fuelAmount) || 0,
      pricePerGallon: Number(backendRecord.pricePerGallon) || 0,
      cost: Number(backendRecord.cost) || 0,
      mileage: Number(backendRecord.mileage) || 0,
    };
  };

  const updateFilters = useCallback((newFilters: Partial<FuelQueryParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except when explicitly setting page)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  const refetch = useCallback(() => {
    fetchFuelRecords();
  }, [fetchFuelRecords]);

  useEffect(() => {
    fetchFuelRecords();
  }, [fetchFuelRecords]);

  return {
    fuelRecords,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useFuel;
