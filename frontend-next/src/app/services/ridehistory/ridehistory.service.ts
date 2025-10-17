import { BaseApiService } from "../base/base-api.service";
import { Ride } from "./ridehistory.types";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";

// Define RideHistoryQueryParams interface
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

interface GetListParams extends Partial<RideHistoryQueryParams> {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class RideHistoryService extends BaseApiService {
  private readonly endpoint = "/rides";

  /**
   * Get ridehistory list with optional filtering and pagination
   */
  async getList(params: GetListParams = {}): Promise<PaginatedResponse<Ride>> {
    try {
      console.log("🔄 Fetching ridehistory with params:", params);
      const response = await this.get(this.endpoint, params);

      // Handle different response formats from the backend
      if (!response) {
        console.warn("⚠️ Received null response from ridehistory API");
        return {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // If response is already in the correct format
      if (response.data && response.pagination) {
        return response;
      }

      // If response is a direct array (fallback for non-paginated endpoints)
      if (Array.isArray(response)) {
        return {
          data: response,
          pagination: {
            page: 1,
            limit: response.length,
            total: response.length,
            totalPages: 1,
          },
        };
      }

      // If response has items property (alternative format)
      if (response.items) {
        return {
          data: response.items,
          pagination: response.pagination ||
            response.meta || {
              page: 1,
              limit: response.items.length,
              total: response.items.length,
              totalPages: 1,
            },
        };
      }

      // Fallback for unexpected response format
      console.warn(
        "⚠️ Unexpected response format from ridehistory API:",
        response
      );
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error("❌ Error fetching ridehistory:", error);

      // For development, always return mock data when there's any error
      console.log(
        "🔄 Backend not available, returning mock data for development"
      );
      return this.getMockData(params);
    }
  }

  /**
   * Get mock data for development when backend is not available
   */
  private getMockData(params: GetListParams = {}): PaginatedResponse<Ride> {
    const mockRides: Ride[] = [
      {
        id: "ride-001",
        passengerId: "passenger-001",
        driverId: "driver-001",
        status: "COMPLETED",
        fare: 25.5,
        distance: 5.2,
        duration: 18,
        startTime: "2024-01-15T10:30:00Z",
        endTime: "2024-01-15T10:48:00Z",
        createdAt: "2024-01-15T10:25:00Z",
        updatedAt: "2024-01-15T10:48:00Z",
        pickupLocationId: "loc-001",
        dropoffLocationId: "loc-002",
        pickupLatitude: 40.7128,
        pickupLongitude: -74.006,
        dropoffLatitude: 40.7589,
        dropoffLongitude: -73.9851,
        passengerName: "John Smith",
        driverName: "Mike Johnson",
        pickupAddress: "123 Main St, New York, NY",
        dropoffAddress: "456 Broadway, New York, NY",
      },
      {
        id: "ride-002",
        passengerId: "passenger-002",
        driverId: "driver-002",
        status: "COMPLETED",
        fare: 18.75,
        distance: 3.8,
        duration: 15,
        startTime: "2024-01-15T14:20:00Z",
        endTime: "2024-01-15T14:35:00Z",
        createdAt: "2024-01-15T14:15:00Z",
        updatedAt: "2024-01-15T14:35:00Z",
        pickupLocationId: "loc-003",
        dropoffLocationId: "loc-004",
        pickupLatitude: 40.7505,
        pickupLongitude: -73.9934,
        dropoffLatitude: 40.7614,
        dropoffLongitude: -73.9776,
        passengerName: "Sarah Wilson",
        driverName: "David Brown",
        pickupAddress: "789 Park Ave, New York, NY",
        dropoffAddress: "321 5th Ave, New York, NY",
      },
      {
        id: "ride-003",
        passengerId: "passenger-003",
        driverId: "driver-003",
        status: "CANCELLED",
        fare: 0,
        distance: 0,
        duration: 0,
        startTime: "2024-01-15T16:45:00Z",
        endTime: undefined,
        createdAt: "2024-01-15T16:40:00Z",
        updatedAt: "2024-01-15T16:50:00Z",
        pickupLocationId: "loc-005",
        dropoffLocationId: "loc-006",
        pickupLatitude: 40.7282,
        pickupLongitude: -73.7949,
        dropoffLatitude: 40.6892,
        dropoffLongitude: -73.9442,
        passengerName: "Emily Davis",
        driverName: "Chris Miller",
        pickupAddress: "555 Queens Blvd, Queens, NY",
        dropoffAddress: "777 Brooklyn Bridge, Brooklyn, NY",
      },
      {
        id: "ride-004",
        passengerId: "passenger-004",
        driverId: "driver-004",
        status: "COMPLETED",
        fare: 32.0,
        distance: 7.1,
        duration: 25,
        startTime: "2024-01-15T09:15:00Z",
        endTime: "2024-01-15T09:40:00Z",
        createdAt: "2024-01-15T09:10:00Z",
        updatedAt: "2024-01-15T09:40:00Z",
        pickupLocationId: "loc-007",
        dropoffLocationId: "loc-008",
        pickupLatitude: 40.7831,
        pickupLongitude: -73.9712,
        dropoffLatitude: 40.7505,
        dropoffLongitude: -73.9934,
        passengerName: "Robert Taylor",
        driverName: "Lisa Anderson",
        pickupAddress: "999 Central Park, New York, NY",
        dropoffAddress: "111 Times Square, New York, NY",
      },
      {
        id: "ride-005",
        passengerId: "passenger-005",
        driverId: "driver-005",
        status: "COMPLETED",
        fare: 22.25,
        distance: 4.5,
        duration: 20,
        startTime: "2024-01-15T19:30:00Z",
        endTime: "2024-01-15T19:50:00Z",
        createdAt: "2024-01-15T19:25:00Z",
        updatedAt: "2024-01-15T19:50:00Z",
        pickupLocationId: "loc-009",
        dropoffLocationId: "loc-010",
        pickupLatitude: 40.7614,
        pickupLongitude: -73.9776,
        dropoffLatitude: 40.7505,
        dropoffLongitude: -73.9934,
        passengerName: "Jennifer Lee",
        driverName: "Tom Wilson",
        pickupAddress: "222 Madison Ave, New York, NY",
        dropoffAddress: "333 Lexington Ave, New York, NY",
      },
    ];

    // Apply filters to mock data
    let filteredRides = mockRides;

    if (params.status) {
      filteredRides = filteredRides.filter(
        (ride) => ride.status === params.status
      );
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredRides = filteredRides.filter(
        (ride) =>
          ride.passengerName?.toLowerCase().includes(searchLower) ||
          ride.driverName?.toLowerCase().includes(searchLower) ||
          ride.pickupAddress?.toLowerCase().includes(searchLower) ||
          ride.dropoffAddress?.toLowerCase().includes(searchLower)
      );
    }

    if (params.minFare !== undefined) {
      filteredRides = filteredRides.filter(
        (ride) => Number(ride.fare) >= params.minFare!
      );
    }

    if (params.maxFare !== undefined) {
      filteredRides = filteredRides.filter(
        (ride) => Number(ride.fare) <= params.maxFare!
      );
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRides = filteredRides.slice(startIndex, endIndex);

    return {
      data: paginatedRides,
      pagination: {
        page,
        limit,
        total: filteredRides.length,
        totalPages: Math.ceil(filteredRides.length / limit),
      },
    };
  }

  /**
   * Get a specific ridehistory by ID
   */
  async getById(id: string): Promise<Ride> {
    return this.get(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new ridehistory entry
   */
  async create(data: Partial<Ride>): Promise<CreateResponse> {
    return this.post(this.endpoint, data);
  }

  /**
   * Update an existing ridehistory entry
   */
  async update(id: string, data: Partial<Ride>): Promise<UpdateResponse> {
    return this.patch(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete a ridehistory entry
   */
  async delete(id: string): Promise<UpdateResponse> {
    return this.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Get ridehistory statistics for a date range
   * Note: This endpoint might not be implemented yet on the backend
   */
  async getStats(
    params: { startDate?: string; endDate?: string } = {}
  ): Promise<any> {
    try {
      return await this.get(`${this.endpoint}/stats`, params);
    } catch (error) {
      console.warn(
        "⚠️ Stats endpoint not available, returning mock data:",
        error
      );
      return {
        total: 0,
        totalRevenue: 0,
        averageValue: 0,
        completed: 0,
        cancelled: 0,
      };
    }
  }

  /**
   * Export ridehistory data
   * Note: This endpoint might not be implemented yet on the backend
   */
  async export(params: GetListParams = {}): Promise<Blob> {
    try {
      const response = await this.request(`${this.endpoint}/export`, {
        method: "GET",
        headers: {
          Accept: "application/csv",
        },
      });
      return response.blob();
    } catch (error) {
      console.warn("⚠️ Export endpoint not available:", error);
      const csvContent = "id,status,createdAt\n";
      return new Blob([csvContent], { type: "text/csv" });
    }
  }
}

// Export singleton instance
export const rideHistoryService = new RideHistoryService();
export default rideHistoryService;
