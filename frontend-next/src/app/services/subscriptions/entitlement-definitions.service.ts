import { BaseDataService } from "../base/base-data.service";
import { PaginatedResponse, CreateResponse, UpdateResponse } from "../base/api-types";
import {
  EntitlementDefinition,
  EntitlementDefinitionQueryParams,
} from "../../types/subscription";

export class EntitlementDefinitionsService extends BaseDataService<
  EntitlementDefinition,
  EntitlementDefinitionQueryParams,
  Partial<EntitlementDefinition>,
  Partial<EntitlementDefinition>
> {
  protected readonly endpoint = "/subscriptions/entitlements/definitions";

  async getDefinitions(
    params?: EntitlementDefinitionQueryParams
  ): Promise<PaginatedResponse<EntitlementDefinition> | EntitlementDefinition[]> {
    return this.getAll(params);
  }

  async getDefinition(id: string): Promise<EntitlementDefinition> {
    return this.getById(id);
  }

  async createDefinition(
    data: Partial<EntitlementDefinition>
  ): Promise<CreateResponse | EntitlementDefinition> {
    return this.create(data as any);
  }

  async updateDefinition(
    id: string,
    data: Partial<EntitlementDefinition>
  ): Promise<UpdateResponse | EntitlementDefinition> {
    return this.update(id, data as any);
  }

  async deactivateDefinition(id: string) {
    return this.delete(id);
  }

  async getDefinitionStats(): Promise<{ total: number; active: number; inactive: number }> {
    return this.get(`${this.endpoint}/stats`);
  }
}

