// Subscription Management Types

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED" | "PENDING";

export interface Subscription {
  id: string;
  userId: string;
  subscriptionPackageId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  subscriptionPackage?: SubscriptionPackage;
}

export interface SubscriptionPackage {
  id: string;
  productSubtypeId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productSubtype?: {
    id: string;
    name: string;
  };
  subscriptionFeatures?: SubscriptionFeature[];
}

export interface PackageFeature {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFeature {
  id: string;
  subscriptionPackageId: string;
  packageFeatureId: string;
  subscriptionPackage?: SubscriptionPackage;
  packageFeature?: PackageFeature;
}

// Query Parameters
export interface SubscriptionQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "status" | "startDate" | "endDate";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: SubscriptionStatus;
  userId?: string;
  subscriptionPackageId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SubscriptionPackageQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "price" | "validityDays" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  productSubtypeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PackageFeatureQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  dateFrom?: string;
  dateTo?: string;
}

// Create DTOs
export interface CreateSubscriptionDto {
  userId: string;
  subscriptionPackageId: string;
  status?: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew?: boolean;
}

export interface CreateSubscriptionPackageDto {
  productSubtypeId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  validityDays: number;
  isActive?: boolean;
}

export interface CreatePackageFeatureDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

// Update DTOs
export interface UpdateSubscriptionDto {
  status?: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
}

export interface UpdateSubscriptionPackageDto {
  productSubtypeId?: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  validityDays?: number;
  isActive?: boolean;
}

export interface UpdatePackageFeatureDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Filter Interfaces
export interface SubscriptionFilters {
  search?: string;
  status?: SubscriptionStatus;
  userId?: string;
  subscriptionPackageId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SubscriptionPackageFilters {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  productSubtypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PackageFeatureFilters {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

