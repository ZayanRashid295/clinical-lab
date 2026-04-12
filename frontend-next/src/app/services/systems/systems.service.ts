import { BaseDataService } from "../base/base-data.service";
import {
  PaginatedResponse,
  CreateResponse,
  UpdateResponse,
} from "../base/api-types";
import { System } from "../../types/content";
import {
  SystemQueryParams,
  CreateSystemDto,
  UpdateSystemDto,
} from "./systems.types";

export class SystemsService extends BaseDataService<
  System,
  SystemQueryParams,
  CreateSystemDto,
  UpdateSystemDto
> {
  protected readonly endpoint = "/systems";

  async getSystems(
    params?: SystemQueryParams
  ): Promise<PaginatedResponse<System> | System[]> {
    return this.getAll(params);
  }

  async getSystem(id: string): Promise<System> {
    return this.getById(id);
  }

  async createSystem(
    data: CreateSystemDto
  ): Promise<CreateResponse | System> {
    return this.create(data);
  }

  async updateSystem(
    id: string,
    data: UpdateSystemDto
  ): Promise<UpdateResponse | System> {
    return this.update(id, data);
  }

  async getSystemStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    return this.get(`${this.endpoint}/stats`);
  }
}
