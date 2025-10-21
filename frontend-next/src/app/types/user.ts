export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userSettings?: UserSettings;
  roles?: UserRole[];
}

export interface UserSettings {
  id: string;
  userId: string;
  language: string;
  timezone: string;
  notifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
  role?: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
  role?: string;
  dateFrom?: string;
  dateTo?: string;
}
