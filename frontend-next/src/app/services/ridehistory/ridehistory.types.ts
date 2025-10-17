// RideHistory specific types
import { Ride } from "../../types/ride";

// Re-export Ride type for convenience
export type { Ride };

// RideHistory specific query parameters
export interface RideHistoryQueryParams {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  minFare?: number;
  maxFare?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Alias for backward compatibility with generated code
export type RideHistoryFilters = RideHistoryQueryParams;
