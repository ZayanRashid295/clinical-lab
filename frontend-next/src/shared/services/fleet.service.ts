import { BaseApiService } from "../../app/services/base/base-api.service";

export class FleetService extends BaseApiService {
  async getFleet(): Promise<any> {
    return this.get("/fleet");
  }

  async getVehicles(): Promise<any> {
    return this.get("/fleet/vehicles");
  }

  async getDrivers(): Promise<any> {
    return this.get("/fleet/drivers");
  }
}

export const fleetService = new FleetService();
