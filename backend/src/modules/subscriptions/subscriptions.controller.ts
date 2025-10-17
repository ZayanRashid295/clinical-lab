import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { CreateSubscriptionPackageDto } from "./dto/create-subscription-package.dto";
import { UpdateSubscriptionPackageDto } from "./dto/update-subscription-package.dto";
import { CreatePackageFeatureDto } from "./dto/create-package-feature.dto";
import { UpdatePackageFeatureDto } from "./dto/update-package-feature.dto";

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ========== SUBSCRIPTION PACKAGES ==========
  @Get("packages")
  @ApiOperation({ summary: "Get all subscription packages" })
  @ApiResponse({ status: 200, description: "Packages retrieved successfully" })
  @ApiQuery({ name: "productSubtypeId", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getPackages(
    @Query("productSubtypeId") productSubtypeId?: string,
    @Query("isActive") isActive?: boolean
  ) {
    return this.subscriptionsService.getPackages(productSubtypeId, isActive);
  }

  @Get("packages/:id")
  @ApiOperation({ summary: "Get package by ID" })
  @ApiResponse({ status: 200, description: "Package retrieved successfully" })
  @ApiResponse({ status: 404, description: "Package not found" })
  async getPackage(@Param("id") id: string) {
    return this.subscriptionsService.getPackage(id);
  }

  @Get("packages/:id/features")
  @ApiOperation({ summary: "Get features for a package" })
  @ApiResponse({ status: 200, description: "Features retrieved successfully" })
  @ApiResponse({ status: 404, description: "Package not found" })
  async getPackageFeatures(@Param("id") id: string) {
    return this.subscriptionsService.getPackageFeatures(id);
  }

  @Post("packages")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new subscription package (Admin only)" })
  @ApiResponse({ status: 201, description: "Package created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createPackage(@Body() createPackageDto: CreateSubscriptionPackageDto) {
    return this.subscriptionsService.createPackage(createPackageDto);
  }

  @Patch("packages/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update subscription package (Admin only)" })
  @ApiResponse({ status: 200, description: "Package updated successfully" })
  @ApiResponse({ status: 404, description: "Package not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updatePackage(
    @Param("id") id: string,
    @Body() updatePackageDto: UpdateSubscriptionPackageDto
  ) {
    return this.subscriptionsService.updatePackage(id, updatePackageDto);
  }

  @Delete("packages/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate subscription package (Admin only)" })
  @ApiResponse({ status: 200, description: "Package deactivated successfully" })
  @ApiResponse({ status: 404, description: "Package not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async removePackage(@Param("id") id: string) {
    return this.subscriptionsService.removePackage(id);
  }

  // ========== USER SUBSCRIPTIONS ==========
  @Get("user/:userId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's subscriptions" })
  @ApiResponse({
    status: 200,
    description: "Subscriptions retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiQuery({ name: "status", required: false, type: String })
  async getUserSubscriptions(
    @Param("userId") userId: string,
    @Query("status") status?: string
  ) {
    return this.subscriptionsService.getUserSubscriptions(userId, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new subscription" })
  @ApiResponse({
    status: 201,
    description: "Subscription created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto
  ) {
    return this.subscriptionsService.createSubscription(createSubscriptionDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update subscription" })
  @ApiResponse({
    status: 200,
    description: "Subscription updated successfully",
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateSubscription(
    @Param("id") id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto
  ) {
    return this.subscriptionsService.updateSubscription(
      id,
      updateSubscriptionDto
    );
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cancel subscription" })
  @ApiResponse({
    status: 200,
    description: "Subscription cancelled successfully",
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async cancelSubscription(@Param("id") id: string) {
    return this.subscriptionsService.cancelSubscription(id);
  }

  // ========== PACKAGE FEATURES ==========
  @Get("features")
  @ApiOperation({ summary: "Get all package features" })
  @ApiResponse({ status: 200, description: "Features retrieved successfully" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  async getFeatures(@Query("isActive") isActive?: boolean) {
    return this.subscriptionsService.getFeatures(isActive);
  }

  @Get("features/:id")
  @ApiOperation({ summary: "Get feature by ID" })
  @ApiResponse({ status: 200, description: "Feature retrieved successfully" })
  @ApiResponse({ status: 404, description: "Feature not found" })
  async getFeature(@Param("id") id: string) {
    return this.subscriptionsService.getFeature(id);
  }

  @Post("features")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new package feature (Admin only)" })
  @ApiResponse({ status: 201, description: "Feature created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createFeature(@Body() createFeatureDto: CreatePackageFeatureDto) {
    return this.subscriptionsService.createFeature(createFeatureDto);
  }

  @Patch("features/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update package feature (Admin only)" })
  @ApiResponse({ status: 200, description: "Feature updated successfully" })
  @ApiResponse({ status: 404, description: "Feature not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updateFeature(
    @Param("id") id: string,
    @Body() updateFeatureDto: UpdatePackageFeatureDto
  ) {
    return this.subscriptionsService.updateFeature(id, updateFeatureDto);
  }

  @Delete("features/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deactivate package feature (Admin only)" })
  @ApiResponse({ status: 200, description: "Feature deactivated successfully" })
  @ApiResponse({ status: 404, description: "Feature not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async removeFeature(@Param("id") id: string) {
    return this.subscriptionsService.removeFeature(id);
  }
}
