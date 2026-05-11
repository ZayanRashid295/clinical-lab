// Category Management Types

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: CategoryProduct[];
  _count?: {
    products: number;
  };
}

export interface CategoryProduct {
  id: string;
  name: string;
  description?: string;
  order: number;
}

// Query Parameters
export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "order" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  dateFrom?: string;
  dateTo?: string;
  /** Backend returns all rows (ignores page/limit). */
  listAll?: boolean;
}

// Create DTOs
export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

// Filter interfaces
export interface CategoryFilters extends CategoryQueryParams {}
