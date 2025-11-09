// Core type definitions for the application

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  avatar?: string;
  isActive: boolean;
  loginTime?: string;
}

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

export interface Location {
  id?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  type?: "pickup" | "dropoff";
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

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface LoginForm {
  email: string;
  password: string;
}
