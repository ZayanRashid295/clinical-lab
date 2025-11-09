// Product Management Types

export interface Product {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productTags?: ProductTag[];
  productSubtypes?: ProductSubtype[];
  _count?: {
    sections: number;
    productTags: number;
    productSubtypes: number;
  };
}

export interface ProductTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: Array<{
    id: string;
    name: string;
  }>;
  _count?: {
    products: number;
    questions: number;
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
}

export interface ProductTagQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  dateFrom?: string;
  dateTo?: string;
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
  tagIds?: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  tagIds?: string[];
}

export interface CreateProductTagDto {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateProductTagDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
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
export interface ProductTagFilters extends ProductTagQueryParams {}
export interface ProductSubtypeFilters extends ProductSubtypeQueryParams {}

