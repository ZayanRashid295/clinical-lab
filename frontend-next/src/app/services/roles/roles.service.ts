import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Role } from "../../types/user";
import { RoleQueryParams, CreateRoleDto, UpdateRoleDto } from "./roles.types";

export class RolesService extends BaseDataService<Role, RoleQueryParams, CreateRoleDto, UpdateRoleDto> {
  protected readonly endpoint = "/roles";

  /**
   * Get roles with optional filtering and pagination
   */
  async getRoles(
    params?: RoleQueryParams
  ): Promise<PaginatedResponse<Role> | Role[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific role by ID
   */
  async getRole(id: string): Promise<Role> {
    return this.getById(id);
  }

  /**
   * Create a new role
   */
  async createRole(roleData: CreateRoleDto): Promise<CreateResponse | Role> {
    return this.create(roleData);
  }

  /**
   * Update an existing role
   */
  async updateRole(
    id: string,
    roleData: UpdateRoleDto
  ): Promise<UpdateResponse | Role> {
    return this.update(id, roleData);
  }

  /**
   * Deactivate a role (soft delete)
   */
  async deactivateRole(id: string): Promise<{ message: string }> {
    return this.delete(id);
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
