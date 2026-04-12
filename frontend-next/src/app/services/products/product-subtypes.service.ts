import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { ProductSubtype } from "../../types/product";
import {
  ProductSubtypeQueryParams,
  CreateProductSubtypeDto,
  UpdateProductSubtypeDto,
} from "./product-subtypes.types";

export class ProductSubtypesService extends BaseDataService<
  ProductSubtype,
  ProductSubtypeQueryParams,
  CreateProductSubtypeDto,
  UpdateProductSubtypeDto
> {
  protected readonly endpoint = "/products/subtypes";

  /**
   * Get product subtypes with optional filtering and pagination
   */
  async getSubtypes(
    params?: ProductSubtypeQueryParams
  ): Promise<PaginatedResponse<ProductSubtype> | ProductSubtype[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific subtype by ID
   */
  async getSubtype(id: string): Promise<ProductSubtype> {
    return this.getById(id);
  }

  /**
   * Create a new product subtype
   */
  async createSubtype(
    subtypeData: CreateProductSubtypeDto
  ): Promise<CreateResponse | ProductSubtype> {
    return this.create(subtypeData);
  }

  /**
   * Update an existing product subtype
   */
  async updateSubtype(
    id: string,
    subtypeData: UpdateProductSubtypeDto
  ): Promise<UpdateResponse | ProductSubtype> {
    return this.update(id, subtypeData);
  }

  /**
   * Get subtype statistics
   */
  async getSubtypeStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

