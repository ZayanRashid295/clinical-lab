import { BaseApiService } from "../../app/services/base/base-api.service";

export interface RidesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
  minFare?: number;
  maxFare?: number;
}

export class RidesService extends BaseApiService {
  async getRides(params?: RidesQueryParams): Promise<any> {
    return this.get("/rides", params);
  }

  async createRide(rideData: any): Promise<any> {
    return this.post("/rides", rideData);
  }

  async getRide(id: string): Promise<any> {
    return this.get(`/rides/${id}`);
  }

  async updateRide(id: string, rideData: any): Promise<any> {
    return this.patch(`/rides/${id}`, rideData);
  }
}

export const ridesService = new RidesService();
