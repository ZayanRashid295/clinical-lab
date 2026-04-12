import { BaseApiService } from "./base-api.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "./api-types";

/**
 * Base interface for data service operations
 * All domain-specific services should implement these methods
 */
export interface IBaseDataService<T, TQueryParams extends Record<string, any> = any, TCreateDto = any, TUpdateDto = any> {
  /**
   * Get all items with optional filtering and pagination
   */
  getAll(params?: TQueryParams): Promise<PaginatedResponse<T> | T[]>;

  /**
   * Get a specific item by ID
   */
  getById(id: string): Promise<T>;

  /**
   * Create a new item
   */
  create(data: TCreateDto): Promise<CreateResponse | T>;

  /**
   * Update an existing item
   */
  update(id: string, data: TUpdateDto): Promise<UpdateResponse | T>;

  /**
   * Soft delete (typically sets inactive / isActive false)
   */
  delete(id: string): Promise<{ message: string }>;

  /**
   * Get statistics (optional)
   */
  getStats?(): Promise<any>;
}

/**
 * Abstract base class for data services
 * Provides common structure but allows flexibility
 */
export abstract class BaseDataService<T, TQueryParams extends Record<string, any> = any, TCreateDto = any, TUpdateDto = any>
  extends BaseApiService
  implements IBaseDataService<T, TQueryParams, TCreateDto, TUpdateDto>
{
  protected abstract readonly endpoint: string;

  /**
   * Get all items with optional filtering and pagination
   */
  async getAll(params?: TQueryParams): Promise<PaginatedResponse<T> | T[]> {
    return this.get(this.endpoint, params ? (params as Record<string, any>) : undefined);
  }

  /**
   * Get a specific item by ID
   */
  async getById(id: string): Promise<T> {
    return this.get(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new item
   */
  async create(data: TCreateDto): Promise<CreateResponse | T> {
    return this.post(this.endpoint, data);
  }

  /**
   * Update an existing item
   */
  async update(id: string, data: TUpdateDto): Promise<UpdateResponse | T> {
    return this.patch(`${this.endpoint}/${id}`, data);
  }

  /**
   * Soft delete (typically sets inactive / isActive false)
   */
  async delete(id: string): Promise<{ message: string }> {
    return super.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Permanently remove an item (hard delete). Backend route: DELETE {endpoint}/permanent/:id
   */
  async deletePermanent(id: string): Promise<{ message: string }> {
    return super.delete(`${this.endpoint}/permanent/${id}`);
  }

  /**
   * Get statistics (optional - override in subclasses if needed)
   */
  async getStats?(): Promise<any> {
    return this.get(`${this.endpoint}/stats`);
  }
}

