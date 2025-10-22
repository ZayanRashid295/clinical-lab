import { BaseApiService } from "../base/base-api.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Role } from "../../types/user";
import { RoleQueryParams, CreateRoleDto, UpdateRoleDto } from "./roles.types";

export class RolesService extends BaseApiService {
  private readonly endpoint = "/roles";

  /**
   * Get roles with optional filtering and pagination
   */
  async getRoles(
    params?: RoleQueryParams
  ): Promise<PaginatedResponse<Role> | Role[]> {
    return this.get(this.endpoint, params);
  }

  /**
   * Get a specific role by ID
   */
  async getRole(id: string): Promise<Role> {
    return this.get(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new role
   */
  async createRole(roleData: CreateRoleDto): Promise<CreateResponse<Role>> {
    return this.post(this.endpoint, roleData);
  }

  /**
   * Update an existing role
   */
  async updateRole(
    id: string,
    roleData: UpdateRoleDto
  ): Promise<UpdateResponse<Role>> {
    return this.patch(`${this.endpoint}/${id}`, roleData);
  }

  /**
   * Deactivate a role (soft delete)
   */
  async deactivateRole(id: string): Promise<{ message: string }> {
    return this.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Get role statistics
   */
  async getRoleStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}
