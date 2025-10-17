import { useState, useEffect, useCallback } from "react";
import { rideHistoryService } from "../app/services/ridehistory/ridehistory.service";
import { Ride, RideQueryParams } from "../app/types/ride";
import { PaginatedResponse } from "../app/types/core";

interface UseRidesResult {
  rides: Ride[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (filters: Partial<RideQueryParams>) => void;
  filters: RideQueryParams;
}

export const useRides = (
  initialFilters: RideQueryParams = {}
): UseRidesResult => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<RideQueryParams>({
    page: 1,
    limit: 10,
    ...initialFilters,
  });

  const fetchRides = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await rideHistoryService.getList(filters);

      // Handle different response formats
      if (response.data && Array.isArray(response.data)) {
        // Paginated response
        setRides(response.data.map(transformRide));
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else if (Array.isArray(response)) {
        // Simple array response
        setRides(response.map(transformRide));
        setPagination({
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: response.length,
          totalPages: Math.ceil(response.length / (filters.limit || 10)),
        });
      } else {
        console.error("Unexpected response format:", response);
        setError("Unexpected response format from server");
        setRides([]);
      }
    } catch (err) {
      console.error("Error fetching rides:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch rides");
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Transform backend ride data to frontend format
  const transformRide = (backendRide: any): Ride => {
    return {
      ...backendRide,
      // Compute display helpers
      passengerName:
        backendRide.passenger?.name || backendRide.passengerName || "Unknown",
      driverName:
        backendRide.driver?.name || backendRide.driverName || "Unassigned",
      pickupAddress:
        backendRide.pickupLocation?.address ||
        backendRide.pickupAddress ||
        "Unknown",
      dropoffAddress:
        backendRide.dropoffLocation?.address ||
        backendRide.dropoffAddress ||
        "Unknown",
      fare: Number(backendRide.fare) || 0,
      distance: backendRide.distance ? Number(backendRide.distance) : undefined,
      duration: backendRide.duration ? Number(backendRide.duration) : undefined,
    };
  };

  const updateFilters = useCallback((newFilters: Partial<RideQueryParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except when explicitly setting page)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  const refetch = useCallback(() => {
    fetchRides();
  }, [fetchRides]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  return {
    rides,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useRides;
