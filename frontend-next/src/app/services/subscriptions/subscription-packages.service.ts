import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { SubscriptionPackage } from "../../types/subscription";
import {
  SubscriptionPackageQueryParams,
  CreateSubscriptionPackageDto,
  UpdateSubscriptionPackageDto,
} from "./subscription-packages.types";

export class SubscriptionPackagesService extends BaseDataService<
  SubscriptionPackage,
  SubscriptionPackageQueryParams,
  CreateSubscriptionPackageDto,
  UpdateSubscriptionPackageDto
> {
  protected readonly endpoint = "/subscriptions/packages";

  /**
   * Get subscription packages with optional filtering and pagination
   */
  async getPackages(
    params?: SubscriptionPackageQueryParams
  ): Promise<PaginatedResponse<SubscriptionPackage> | SubscriptionPackage[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific package by ID
   */
  async getPackage(id: string): Promise<SubscriptionPackage> {
    return this.getById(id);
  }

  /**
   * Create a new subscription package
   */
  async createPackage(
    packageData: CreateSubscriptionPackageDto
  ): Promise<CreateResponse | SubscriptionPackage> {
    return this.create(packageData);
  }

  /**
   * Update an existing subscription package
   */
  async updatePackage(
    id: string,
    packageData: UpdateSubscriptionPackageDto
  ): Promise<UpdateResponse | SubscriptionPackage> {
    return this.update(id, packageData);
  }

  /**
   * Get package statistics
   */
  async getPackageStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

