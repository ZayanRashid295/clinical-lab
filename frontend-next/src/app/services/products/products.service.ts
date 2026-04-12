import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { Product } from "../../types/product";
import {
  ProductQueryParams,
  CreateProductDto,
  UpdateProductDto,
} from "./products.types";

export class ProductsService extends BaseDataService<
  Product,
  ProductQueryParams,
  CreateProductDto,
  UpdateProductDto
> {
  protected readonly endpoint = "/products";

  /**
   * Get products with optional filtering and pagination
   */
  async getProducts(
    params?: ProductQueryParams
  ): Promise<PaginatedResponse<Product> | Product[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific product by ID
   */
  async getProduct(id: string): Promise<Product> {
    return this.getById(id);
  }

  /**
   * Create a new product
   */
  async createProduct(
    productData: CreateProductDto
  ): Promise<CreateResponse | Product> {
    return this.create(productData);
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    id: string,
    productData: UpdateProductDto
  ): Promise<UpdateResponse | Product> {
    return this.update(id, productData);
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

