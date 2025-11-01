import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { User } from "../../types/user";
import { UserQueryParams, CreateUserDto, UpdateUserDto } from "./users.types";

export class UsersService extends BaseDataService<User, UserQueryParams, CreateUserDto, UpdateUserDto> {
  protected readonly endpoint = "/users";

  /**
   * Get users with optional filtering and pagination
   */
  async getUsers(
    params?: UserQueryParams
  ): Promise<PaginatedResponse<User> | User[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific user by ID
   */
  async getUser(id: string): Promise<User> {
    return this.getById(id);
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserDto): Promise<CreateResponse<User>> {
    return this.create(userData);
  }

  /**
   * Update an existing user
   */
  async updateUser(
    id: string,
    userData: UpdateUserDto
  ): Promise<UpdateResponse<User>> {
    return this.update(id, userData);
  }

  /**
   * Deactivate a user (soft delete)
   */
  async deactivateUser(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}
