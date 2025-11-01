import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { ProductTag } from "../../types/product";
import {
  ProductTagQueryParams,
  CreateProductTagDto,
  UpdateProductTagDto,
} from "./product-tags.types";

export class ProductTagsService extends BaseDataService<
  ProductTag,
  ProductTagQueryParams,
  CreateProductTagDto,
  UpdateProductTagDto
> {
  protected readonly endpoint = "/products/tags";

  /**
   * Get product tags with optional filtering and pagination
   */
  async getTags(
    params?: ProductTagQueryParams
  ): Promise<PaginatedResponse<ProductTag> | ProductTag[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific tag by ID
   */
  async getTag(id: string): Promise<ProductTag> {
    return this.getById(id);
  }

  /**
   * Create a new product tag
   */
  async createTag(
    tagData: CreateProductTagDto
  ): Promise<CreateResponse<ProductTag>> {
    return this.create(tagData);
  }

  /**
   * Update an existing product tag
   */
  async updateTag(
    id: string,
    tagData: UpdateProductTagDto
  ): Promise<UpdateResponse<ProductTag>> {
    return this.update(id, tagData);
  }

  /**
   * Deactivate a product tag (soft delete)
   */
  async deactivateTag(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get tag statistics
   */
  async getTagStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

