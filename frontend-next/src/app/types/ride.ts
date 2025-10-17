// Ride-related type definitions

import { Location } from "./core";

export type RideStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "ARRIVING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface RideLocation {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  type?: "pickup" | "dropoff";
}

export interface RideUser {
  id: string;
  name?: string; // Optional for backward compatibility
  email: string;
  phone?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
}

export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  status: RideStatus;
  fare: number | string; // Can be string from Prisma Decimal fields
  distance?: number; // in kilometers
  duration?: number; // in minutes
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;

  // Location data
  pickupLocationId?: string;
  dropoffLocationId?: string;
  pickupLocation?: RideLocation;
  dropoffLocation?: RideLocation;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffLatitude?: number;
  dropoffLongitude?: number;

  // Additional ride metadata
  metadata?: {
    rideType?: string;
    passengers?: number;
    specialInstructions?: string;
    [key: string]: any;
  };

  // Relations
  passenger?: RideUser;
  driver?: RideUser;

  // Display helpers (computed from relations)
  passengerName?: string;
  driverName?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
}

export interface RideFilters {
  status?: RideStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minFare?: number;
  maxFare?: number;
}

export interface RideQueryParams extends RideFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
