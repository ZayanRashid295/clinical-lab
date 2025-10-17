// Fleet management type definitions

export type VehicleStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "RETIRED";
export type DriverStatus = "ACTIVE" | "SUSPENDED" | "PENDING" | "INACTIVE";
export type MaintenanceStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type MaintenanceType = "ROUTINE" | "REPAIR" | "INSPECTION" | "EMERGENCY";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color: string;
  status: VehicleStatus;
  mileage: number;
  fuelLevel: number;
  lastMaintenance: string;
  nextMaintenance: string;
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  driverId?: string;
  driverName?: string;
  createdAt: string;
  updatedAt: string;

  // Additional metadata
  metadata?: {
    fuelType?: string;
    transmission?: string;
    engineSize?: string;
    seatingCapacity?: number;
    [key: string]: any;
  };
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: DriverStatus;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  vehicleId?: string;
  vehicleInfo?: string;
  location?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  lastActive: string;
  createdAt: string;
  updatedAt: string;

  // Additional metadata
  metadata?: {
    emergencyContact?: string;
    insuranceProvider?: string;
    backgroundCheckDate?: string;
    [key: string]: any;
  };
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleInfo: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  description: string;
  cost: number;
  date: string;
  technician: string;
  notes?: string;
  nextServiceDate?: string;
  mileage: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  vehicle?: Vehicle;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  vehicleInfo: string;
  fuelAmount: number;
  pricePerGallon: number;
  cost: number;
  location: string;
  driverName: string;
  date: string;
  mileage: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  vehicle?: Vehicle;
  driver?: Driver;
}

export interface Route {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedTime: number;
  revenue: number;
  vehicleId?: string;
  driverId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  vehicle?: Vehicle;
  driver?: Driver;
}

// Fleet Filter Types
export interface VehicleFilters {
  status?: VehicleStatus;
  search?: string;
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
}

export interface DriverFilters {
  status?: DriverStatus;
  search?: string;
  ratingFrom?: number;
  ratingTo?: number;
  ridesFrom?: number;
  ridesTo?: number;
}

export interface MaintenanceFilters {
  status?: MaintenanceStatus;
  type?: MaintenanceType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  costFrom?: number;
  costTo?: number;
}

export interface FuelFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  costFrom?: number;
  costTo?: number;
  vehicleId?: string;
}

// Fleet Query Params
export interface VehicleQueryParams extends VehicleFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DriverQueryParams extends DriverFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface MaintenanceQueryParams extends MaintenanceFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FuelQueryParams extends FuelFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
