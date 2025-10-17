import { BaseApiService } from "../../app/services/base/base-api.service";

export class LocationsService extends BaseApiService {
  async createLocation(locationData: any): Promise<any> {
    return this.post("/locations", locationData);
  }

  async getLocations(): Promise<any> {
    return this.get("/locations");
  }

  async updateDriverLocation(
    driverId: string,
    locationData: any
  ): Promise<any> {
    return this.put(`/locations/driver/${driverId}`, locationData);
  }

  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number = 5
  ): Promise<any> {
    return this.get("/locations/nearby", {
      lat: latitude,
      lng: longitude,
      radius,
    });
  }
}

export const locationsService = new LocationsService();
