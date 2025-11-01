import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { PackageFeature } from "../../types/subscription";
import {
  PackageFeatureQueryParams,
  CreatePackageFeatureDto,
  UpdatePackageFeatureDto,
} from "./package-features.types";

export class PackageFeaturesService extends BaseDataService<
  PackageFeature,
  PackageFeatureQueryParams,
  CreatePackageFeatureDto,
  UpdatePackageFeatureDto
> {
  protected readonly endpoint = "/subscriptions/features";

  /**
   * Get package features with optional filtering and pagination
   */
  async getFeatures(
    params?: PackageFeatureQueryParams
  ): Promise<PaginatedResponse<PackageFeature> | PackageFeature[]> {
    return this.getAll(params);
  }

  /**
   * Get a specific feature by ID
   */
  async getFeature(id: string): Promise<PackageFeature> {
    return this.getById(id);
  }

  /**
   * Create a new package feature
   */
  async createFeature(
    featureData: CreatePackageFeatureDto
  ): Promise<CreateResponse<PackageFeature>> {
    return this.create(featureData);
  }

  /**
   * Update an existing package feature
   */
  async updateFeature(
    id: string,
    featureData: UpdatePackageFeatureDto
  ): Promise<UpdateResponse<PackageFeature>> {
    return this.update(id, featureData);
  }

  /**
   * Deactivate a package feature (soft delete)
   */
  async deactivateFeature(id: string): Promise<{ message: string }> {
    return this.delete(id);
  }

  /**
   * Get feature statistics
   */
  async getFeatureStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

