import { useState, useEffect, useCallback } from "react";
import { apiService } from "../../shared/services/api.service";
import {
  MaintenanceRecord,
  MaintenanceQueryParams,
} from "../../app/types/fleet";
import { PaginatedResponse } from "../../app/types/core";
import { MOCK_MAINTENANCE_RECORDS } from "../../data/mockData";

interface UseMaintenanceResult {
  maintenanceRecords: MaintenanceRecord[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (filters: Partial<MaintenanceQueryParams>) => void;
  filters: MaintenanceQueryParams;
}

export const useMaintenance = (
  initialFilters: MaintenanceQueryParams = {}
): UseMaintenanceResult => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<MaintenanceQueryParams>({
    page: 1,
    limit: 10,
    ...initialFilters,
  });

  const fetchMaintenanceRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data. In production, this would call the API
      // const response = await apiService.getMaintenanceRecords(filters);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter mock data based on current filters
      let filteredRecords = [...MOCK_MAINTENANCE_RECORDS];

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredRecords = filteredRecords.filter(
          (record) =>
            record.vehicleInfo.toLowerCase().includes(searchTerm) ||
            record.description.toLowerCase().includes(searchTerm) ||
            record.technician.toLowerCase().includes(searchTerm) ||
            (record.notes && record.notes.toLowerCase().includes(searchTerm))
        );
      }

      // Apply status filter
      if (filters.status) {
        filteredRecords = filteredRecords.filter(
          (record) => record.status === filters.status
        );
      }

      // Apply type filter
      if (filters.type) {
        filteredRecords = filteredRecords.filter(
          (record) => record.type === filters.type
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

      setMaintenanceRecords(paginatedRecords.map(transformMaintenanceRecord));
      setPagination({
        page,
        limit,
        total: filteredRecords.length,
        totalPages: Math.ceil(filteredRecords.length / limit),
      });
    } catch (err) {
      console.error("Error fetching maintenance records:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch maintenance records"
      );
      setMaintenanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Transform backend maintenance record data to frontend format
  const transformMaintenanceRecord = (
    backendRecord: any
  ): MaintenanceRecord => {
    return {
      ...backendRecord,
      // Ensure proper types
      cost: Number(backendRecord.cost) || 0,
      mileage: Number(backendRecord.mileage) || 0,
    };
  };

  const updateFilters = useCallback(
    (newFilters: Partial<MaintenanceQueryParams>) => {
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
    fetchMaintenanceRecords();
  }, [fetchMaintenanceRecords]);

  useEffect(() => {
    fetchMaintenanceRecords();
  }, [fetchMaintenanceRecords]);

  return {
    maintenanceRecords,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useMaintenance;
