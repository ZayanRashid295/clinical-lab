import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaService) {}

  async create(createRideDto: any) {
    // Validate required fields
    if (!createRideDto.passengerId) {
      throw new Error("Passenger ID is required");
    }
    if (!createRideDto.pickupLocationId) {
      throw new Error("Pickup location ID is required");
    }
    if (!createRideDto.dropoffLocationId) {
      throw new Error("Dropoff location ID is required");
    }

    // Validate fare amount
    if (createRideDto.fare && createRideDto.fare < 0) {
      throw new Error("Fare amount cannot be negative");
    }

    // Set default fare if not provided
    if (!createRideDto.fare) {
      createRideDto.fare = 0; // Will be calculated later
    }

    return this.prisma.ride.create({
      data: createRideDto,
      include: {
        passenger: true,
        driver: true,
        pickupLocation: true,
        dropoffLocation: true,
      },
    });
  }

  async findAll(queryParams?: {
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
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      dateFrom,
      dateTo,
      minFare,
      maxFare,
    } = queryParams || {};

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          passenger: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          driver: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          pickupLocation: {
            address: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          dropoffLocation: {
            address: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (minFare !== undefined || maxFare !== undefined) {
      where.fare = {};
      if (minFare !== undefined) {
        where.fare.gte = minFare;
      }
      if (maxFare !== undefined) {
        where.fare.lte = maxFare;
      }
    }

    // Build order by clause
    let orderBy: any = {};
    if (sortBy) {
      // Map frontend field names to proper Prisma orderBy structure
      switch (sortBy) {
        case "driverName":
          orderBy = { driver: { firstName: sortOrder } };
          break;
        case "passengerName":
          orderBy = { passenger: { firstName: sortOrder } };
          break;
        case "pickupAddress":
          orderBy = { pickupLocation: { address: sortOrder } };
          break;
        case "dropoffAddress":
          orderBy = { dropoffLocation: { address: sortOrder } };
          break;
        default:
          // For direct fields on the Ride model
          orderBy = { [sortBy]: sortOrder };
          break;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.prisma.ride.count({ where });

    // Get rides with pagination
    const rides = await this.prisma.ride.findMany({
      where,
      include: {
        passenger: true,
        driver: true,
        pickupLocation: true,
        dropoffLocation: true,
      },
      orderBy,
      skip,
      take: limit,
    });

    // Transform rides to include computed fields
    const transformedRides = rides.map((ride) => ({
      ...ride,
      passengerName: ride.passenger
        ? `${ride.passenger.firstName} ${ride.passenger.lastName}`.trim() ||
          ride.passenger.email
        : "Unknown",
      driverName: ride.driver
        ? `${ride.driver.firstName} ${ride.driver.lastName}`.trim() ||
          ride.driver.email
        : "Unassigned",
      pickupAddress: ride.pickupLocation?.address || "Unknown pickup",
      dropoffAddress: ride.dropoffLocation?.address || "Unknown dropoff",
    }));

    return {
      data: transformedRides,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.ride.findUnique({
      where: { id },
      include: {
        passenger: true,
        driver: true,
        pickupLocation: true,
        dropoffLocation: true,
        rideReviews: true,
        rideMessages: true,
      },
    });
  }

  async update(id: string, updateRideDto: any) {
    return this.prisma.ride.update({
      where: { id },
      data: updateRideDto,
      include: {
        passenger: true,
        driver: true,
        pickupLocation: true,
        dropoffLocation: true,
      },
    });
  }
}
