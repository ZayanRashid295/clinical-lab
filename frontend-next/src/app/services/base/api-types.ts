// Common API response types and interfaces

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
  timestamp: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  timestamp: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateResponse {
  id: string;
  message: string;
}

export interface UpdateResponse {
  message: string;
  updated: boolean;
}

export interface DeleteResponse {
  message: string;
  deleted: boolean;
}
