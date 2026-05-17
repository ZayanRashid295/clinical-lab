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

/** Roles seeded for MedPrepAI (education). */
export type AppUserRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "FACULTY"
  | "STUDENT"
  | "INSTITUTION_MANAGER";

export interface UserQueryParams {
  page?: number;
  limit?: number;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "firstName"
    | "lastName"
    | "email"
    | "isActive"
    | "role";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  role?: AppUserRole;
  dateFrom?: string;
  dateTo?: string;
  /** Backend returns all rows (ignores page/limit). */
  listAll?: boolean;
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
  status?: "ACTIVE" | "INACTIVE";
  role?: AppUserRole;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Role Management Types
export interface RoleQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "displayName" | "isActive";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateRoleDto {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isActive?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  displayName?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface RoleFilters {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
