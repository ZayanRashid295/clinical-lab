// Product Management Types

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  order?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productSubtypes?: ProductSubtype[];
  _count?: {
    systems: number;
    productSubtypes: number;
  };
}

export interface ProductSubtype {
  id: string;
  productId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
  };
  subscriptionPackages?: Array<{
    id: string;
    name: string;
  }>;
}

// Query Parameters
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  dateFrom?: string;
  dateTo?: string;
  listAll?: boolean;
}

export interface ProductSubtypeQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Create DTOs
export interface CreateProductDto {
  name: string;
  description?: string;
  isActive?: boolean;
  categoryId?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  categoryId?: string | null;
}

export interface CreateProductSubtypeDto {
  productId: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProductSubtypeDto {
  productId?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Filter interfaces
export interface ProductFilters extends ProductQueryParams {}
export interface ProductSubtypeFilters extends ProductSubtypeQueryParams {}

