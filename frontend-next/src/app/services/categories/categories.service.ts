import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Category } from "../../types/category";
import {
  CategoryQueryParams,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "./categories.types";

export class CategoriesService extends BaseDataService<
  Category,
  CategoryQueryParams,
  CreateCategoryDto,
  UpdateCategoryDto
> {
  protected readonly endpoint = "/categories";

  async getCategories(
    params?: CategoryQueryParams
  ): Promise<PaginatedResponse<Category> | Category[]> {
    return this.getAll(params);
  }

  async getCategoriesPublic(): Promise<Category[]> {
    return this.get(`${this.endpoint}/public`);
  }

  async getCategory(id: string): Promise<Category> {
    return this.getById(id);
  }

  async createCategory(
    data: CreateCategoryDto
  ): Promise<CreateResponse | Category> {
    return this.create(data);
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryDto
  ): Promise<UpdateResponse | Category> {
    return this.update(id, data);
  }

  async getCategoryStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}
