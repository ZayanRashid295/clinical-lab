import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { PayoutsService } from "./payouts.service";
import { CreatePayoutDto } from "./dto/create-payout.dto";
import { UpdatePayoutDto } from "./dto/update-payout.dto";
import { PayoutFiltersDto } from "./dto/payout-filters.dto";
import {
  CreatePayoutSettingsDto,
  UpdatePayoutSettingsDto,
} from "./dto/payout-settings.dto";
import {
  CreateEarningsDto,
  UpdateEarningsDto,
  EarningsFiltersDto,
} from "./dto/earnings.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("payouts")
@Controller("payouts")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  // ==================== PAYOUT ENDPOINTS ====================

  @Post()
  @ApiOperation({ summary: "Create a new payout" })
  @ApiResponse({ status: 201, description: "Payout created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async createPayout(@Body() createPayoutDto: CreatePayoutDto) {
    console.log(
      "🔍 PayoutsController.createPayout called with:",
      createPayoutDto
    );
    return this.payoutsService.createPayout(createPayoutDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all payouts with filtering and pagination" })
  @ApiResponse({ status: 200, description: "Payouts retrieved successfully" })
  async getPayouts(@Query() filters: PayoutFiltersDto) {
    console.log(
      "🔍 PayoutsController.getPayouts called with filters:",
      filters
    );
    return this.payoutsService.getPayouts(filters);
  }

  @Get("driver/:driverId")
  @ApiOperation({ summary: "Get payouts for a specific driver" })
  @ApiResponse({
    status: 200,
    description: "Driver payouts retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async getDriverPayouts(
    @Param("driverId") driverId: string,
    @Query() filters: PayoutFiltersDto
  ) {
    console.log(
      "🔍 PayoutsController.getDriverPayouts called for driver:",
      driverId
    );
    const driverFilters = { ...filters, driverId };
    return this.payoutsService.getPayouts(driverFilters);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payout by ID" })
  @ApiResponse({ status: 200, description: "Payout retrieved successfully" })
  @ApiResponse({ status: 404, description: "Payout not found" })
  async getPayoutById(@Param("id") id: string) {
    console.log("🔍 PayoutsController.getPayoutById called with ID:", id);
    return this.payoutsService.getPayoutById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update payout" })
  @ApiResponse({ status: 200, description: "Payout updated successfully" })
  @ApiResponse({ status: 404, description: "Payout not found" })
  async updatePayout(
    @Param("id") id: string,
    @Body() updatePayoutDto: UpdatePayoutDto
  ) {
    console.log(
      "🔍 PayoutsController.updatePayout called with ID:",
      id,
      "and data:",
      updatePayoutDto
    );
    return this.payoutsService.updatePayout(id, updatePayoutDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete payout" })
  @ApiResponse({ status: 204, description: "Payout deleted successfully" })
  @ApiResponse({ status: 400, description: "Cannot delete non-pending payout" })
  @ApiResponse({ status: 404, description: "Payout not found" })
  async deletePayout(@Param("id") id: string) {
    console.log("🔍 PayoutsController.deletePayout called with ID:", id);
    return this.payoutsService.deletePayout(id);
  }

  // ==================== EARNINGS ENDPOINTS ====================

  @Post("earnings")
  @ApiOperation({ summary: "Create earnings record" })
  @ApiResponse({ status: 201, description: "Earnings created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Driver or ride not found" })
  async createEarnings(@Body() createEarningsDto: CreateEarningsDto) {
    console.log(
      "🔍 PayoutsController.createEarnings called with:",
      createEarningsDto
    );
    return this.payoutsService.createEarnings(createEarningsDto);
  }

  @Get("earnings/all")
  @ApiOperation({ summary: "Get all earnings with filtering and pagination" })
  @ApiResponse({ status: 200, description: "Earnings retrieved successfully" })
  async getEarnings(@Query() filters: EarningsFiltersDto) {
    console.log(
      "🔍 PayoutsController.getEarnings called with filters:",
      filters
    );
    return this.payoutsService.getEarnings(filters);
  }

  @Get("earnings/driver/:driverId")
  @ApiOperation({ summary: "Get earnings for a specific driver" })
  @ApiResponse({
    status: 200,
    description: "Driver earnings retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async getDriverEarnings(
    @Param("driverId") driverId: string,
    @Query() filters: EarningsFiltersDto
  ) {
    console.log(
      "🔍 PayoutsController.getDriverEarnings called for driver:",
      driverId
    );
    const driverFilters = { ...filters, driverId };
    return this.payoutsService.getEarnings(driverFilters);
  }

  @Get("earnings/pending/:driverId")
  @ApiOperation({ summary: "Get pending earnings for a specific driver" })
  @ApiResponse({
    status: 200,
    description: "Pending earnings retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async getPendingEarnings(@Param("driverId") driverId: string) {
    console.log(
      "🔍 PayoutsController.getPendingEarnings called for driver:",
      driverId
    );
    return this.payoutsService.getPendingEarnings(driverId);
  }

  @Post("earnings/calculate/:rideId")
  @ApiOperation({ summary: "Calculate earnings for a specific ride" })
  @ApiResponse({ status: 201, description: "Earnings calculated successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 404, description: "Ride not found" })
  async calculateEarningsForRide(@Param("rideId") rideId: string) {
    console.log(
      "🔍 PayoutsController.calculateEarningsForRide called for ride:",
      rideId
    );
    return this.payoutsService.calculateEarningsForRide(rideId);
  }

  // ==================== PAYOUT SETTINGS ENDPOINTS ====================

  @Get("settings/driver/:driverId")
  @ApiOperation({ summary: "Get payout settings for a specific driver" })
  @ApiResponse({
    status: 200,
    description: "Payout settings retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async getPayoutSettings(@Param("driverId") driverId: string) {
    console.log(
      "🔍 PayoutsController.getPayoutSettings called for driver:",
      driverId
    );
    return this.payoutsService.getPayoutSettings(driverId);
  }

  @Patch("settings/driver/:driverId")
  @ApiOperation({ summary: "Update payout settings for a specific driver" })
  @ApiResponse({
    status: 200,
    description: "Payout settings updated successfully",
  })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async updatePayoutSettings(
    @Param("driverId") driverId: string,
    @Body() updateSettingsDto: UpdatePayoutSettingsDto
  ) {
    console.log(
      "🔍 PayoutsController.updatePayoutSettings called for driver:",
      driverId,
      "with data:",
      updateSettingsDto
    );
    return this.payoutsService.updatePayoutSettings(
      driverId,
      updateSettingsDto
    );
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Post("process-scheduled")
  @ApiOperation({ summary: "Process all scheduled payouts (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Scheduled payouts processed successfully",
  })
  async processScheduledPayouts() {
    console.log("🔍 PayoutsController.processScheduledPayouts called");
    return this.payoutsService.processScheduledPayouts();
  }

  // ==================== STATISTICS ENDPOINTS ====================

  @Get("stats/overview")
  @ApiOperation({ summary: "Get payout statistics overview" })
  @ApiResponse({
    status: 200,
    description: "Statistics retrieved successfully",
  })
  async getPayoutStats() {
    console.log("🔍 PayoutsController.getPayoutStats called");

    const [
      totalPayouts,
      completedPayouts,
      pendingPayouts,
      failedPayouts,
      totalEarnings,
      pendingEarnings,
    ] = await Promise.all([
      this.payoutsService
        .getPayouts({ limit: 1 })
        .then((result) => result.pagination.total),
      this.payoutsService
        .getPayouts({ status: "COMPLETED" as any, limit: 1 })
        .then((result) => result.pagination.total),
      this.payoutsService
        .getPayouts({ status: "PENDING" as any, limit: 1 })
        .then((result) => result.pagination.total),
      this.payoutsService
        .getPayouts({ status: "FAILED" as any, limit: 1 })
        .then((result) => result.pagination.total),
      this.payoutsService
        .getEarnings({ limit: 1 })
        .then((result) => result.pagination.total),
      this.payoutsService
        .getEarnings({ status: "PENDING" as any, limit: 1 })
        .then((result) => result.pagination.total),
    ]);

    return {
      payouts: {
        total: totalPayouts,
        completed: completedPayouts,
        pending: pendingPayouts,
        failed: failedPayouts,
      },
      earnings: {
        total: totalEarnings,
        pending: pendingEarnings,
      },
    };
  }

  @Get("stats/driver/:driverId")
  @ApiOperation({ summary: "Get payout statistics for a specific driver" })
  @ApiResponse({
    status: 200,
    description: "Driver statistics retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Driver not found" })
  async getDriverPayoutStats(@Param("driverId") driverId: string) {
    console.log(
      "🔍 PayoutsController.getDriverPayoutStats called for driver:",
      driverId
    );

    const [driverPayouts, driverEarnings, pendingEarnings] = await Promise.all([
      this.payoutsService.getPayouts({ driverId, limit: 1 }),
      this.payoutsService.getEarnings({ driverId, limit: 1 }),
      this.payoutsService.getPendingEarnings(driverId),
    ]);

    const totalPayoutAmount = driverPayouts.data.reduce(
      (sum, payout) => sum + Number(payout.amount),
      0
    );
    const totalEarningsAmount = driverEarnings.data.reduce(
      (sum, earning) => sum + Number(earning.netEarnings),
      0
    );
    const pendingAmount = pendingEarnings.reduce(
      (sum, earning) => sum + Number(earning.netEarnings),
      0
    );

    return {
      payouts: {
        total: driverPayouts.pagination.total,
        totalAmount: totalPayoutAmount,
        completed: driverPayouts.data.filter((p) => p.status === "COMPLETED")
          .length,
        pending: driverPayouts.data.filter((p) => p.status === "PENDING")
          .length,
        failed: driverPayouts.data.filter((p) => p.status === "FAILED").length,
      },
      earnings: {
        total: driverEarnings.pagination.total,
        totalAmount: totalEarningsAmount,
        pending: pendingEarnings.length,
        pendingAmount: pendingAmount,
      },
    };
  }
}
