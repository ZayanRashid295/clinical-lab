import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async updateDriverLocation(driverId: string, locationData: any) {
    // Validate required fields
    if (!locationData.latitude || !locationData.longitude) {
      throw new Error("Latitude and longitude are required");
    }

    // Validate coordinate ranges
    if (locationData.latitude < -90 || locationData.latitude > 90) {
      throw new Error("Latitude must be between -90 and 90");
    }
    if (locationData.longitude < -180 || locationData.longitude > 180) {
      throw new Error("Longitude must be between -180 and 180");
    }

    return this.prisma.driverLocation.upsert({
      where: { driverId },
      update: locationData,
      create: {
        driverId,
        ...locationData,
      },
    });
  }

  async getDriverLocation(driverId: string) {
    return this.prisma.driverLocation.findUnique({
      where: { driverId },
    });
  }

  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number = 5
  ) {
    // This is a simplified version - in production you'd use PostGIS or similar
    return this.prisma.driverLocation.findMany({
      where: {
        isActive: true,
        latitude: {
          gte: latitude - radius / 111, // Rough conversion to degrees
          lte: latitude + radius / 111,
        },
        longitude: {
          gte: longitude - radius / 111,
          lte: longitude + radius / 111,
        },
      },
      include: {
        driver: true,
      },
    });
  }

  async createAddress(createAddressDto: any) {
    // Validate required fields
    if (!createAddressDto.street) {
      throw new Error("Street is required");
    }
    if (!createAddressDto.city) {
      throw new Error("City is required");
    }
    if (!createAddressDto.state) {
      throw new Error("State is required");
    }
    if (!createAddressDto.zipCode) {
      throw new Error("ZIP code is required");
    }

    // Validate coordinates if provided
    if (
      createAddressDto.latitude &&
      (createAddressDto.latitude < -90 || createAddressDto.latitude > 90)
    ) {
      throw new Error("Latitude must be between -90 and 90");
    }
    if (
      createAddressDto.longitude &&
      (createAddressDto.longitude < -180 || createAddressDto.longitude > 180)
    ) {
      throw new Error("Longitude must be between -180 and 180");
    }

    return this.prisma.address.create({
      data: createAddressDto,
    });
  }

  async getUserAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
    });
  }

  async createLocation(createLocationDto: any) {
    // Validate required fields
    if (!createLocationDto.address) {
      throw new Error("Address is required");
    }
    if (!createLocationDto.latitude) {
      throw new Error("Latitude is required");
    }
    if (!createLocationDto.longitude) {
      throw new Error("Longitude is required");
    }

    // Validate coordinate ranges
    if (createLocationDto.latitude < -90 || createLocationDto.latitude > 90) {
      throw new Error("Latitude must be between -90 and 90");
    }
    if (
      createLocationDto.longitude < -180 ||
      createLocationDto.longitude > 180
    ) {
      throw new Error("Longitude must be between -180 and 180");
    }

    return this.prisma.location.create({
      data: createLocationDto,
    });
  }

  async getLocations() {
    return this.prisma.location.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
