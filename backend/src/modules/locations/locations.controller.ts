import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { LocationsService } from "./locations.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("locations")
@Controller("locations")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post("driver/:driverId/location")
  @ApiOperation({ summary: "Update driver location" })
  @ApiResponse({
    status: 200,
    description: "Driver location updated successfully",
  })
  updateDriverLocation(
    @Param("driverId") driverId: string,
    @Body() locationData: any
  ) {
    return this.locationsService.updateDriverLocation(driverId, locationData);
  }

  @Get("driver/:driverId/location")
  @ApiOperation({ summary: "Get driver location" })
  @ApiResponse({
    status: 200,
    description: "Driver location retrieved successfully",
  })
  getDriverLocation(@Param("driverId") driverId: string) {
    return this.locationsService.getDriverLocation(driverId);
  }

  @Get("nearby-drivers")
  @ApiOperation({ summary: "Get nearby drivers" })
  @ApiResponse({
    status: 200,
    description: "Nearby drivers retrieved successfully",
  })
  getNearbyDrivers(@Body() locationData: any) {
    return this.locationsService.getNearbyDrivers(
      locationData.latitude,
      locationData.longitude,
      locationData.radius
    );
  }

  @Post()
  @ApiOperation({ summary: "Create location" })
  @ApiResponse({ status: 201, description: "Location created successfully" })
  createLocation(@Body() createLocationDto: any) {
    return this.locationsService.createLocation(createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all locations" })
  @ApiResponse({ status: 200, description: "Locations retrieved successfully" })
  getLocations() {
    return this.locationsService.getLocations();
  }

  @Post("addresses")
  @ApiOperation({ summary: "Create address" })
  @ApiResponse({ status: 201, description: "Address created successfully" })
  createAddress(@Body() createAddressDto: any) {
    return this.locationsService.createAddress(createAddressDto);
  }

  @Get("addresses/user/:userId")
  @ApiOperation({ summary: "Get user addresses" })
  @ApiResponse({
    status: 200,
    description: "User addresses retrieved successfully",
  })
  getUserAddresses(@Param("userId") userId: string) {
    return this.locationsService.getUserAddresses(userId);
  }
}
