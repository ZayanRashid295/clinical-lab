import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("payments")
@Controller("payments")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: "Process payment" })
  @ApiResponse({ status: 201, description: "Payment processed successfully" })
  create(@Body() createPaymentDto: any) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all payments with pagination" })
  @ApiResponse({ status: 200, description: "Payments retrieved successfully" })
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("method") method?: string,
    @Query("search") search?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("minAmount") minAmount?: string,
    @Query("maxAmount") maxAmount?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    const queryParams = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
      method,
      search,
      dateFrom,
      dateTo,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
    };
    
    return this.paymentsService.findAll(queryParams);
  }

  // Payment Methods endpoints (must be before @Get(':id') to avoid route conflicts)
  @Get("methods")
  @ApiOperation({ summary: "Get payment methods" })
  @ApiResponse({
    status: 200,
    description: "Payment methods retrieved successfully",
  })
  async getPaymentMethods(@Query("userId") userId?: string) {
    console.log(
      "🔍 PaymentsController.getPaymentMethods called with userId:",
      userId
    );
    try {
      const result = await this.paymentsService.getPaymentMethods(userId);
      console.log("🔍 Controller returning result:", result);
      return result;
    } catch (error) {
      console.error("❌ Controller error:", error);
      throw error;
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payment by ID" })
  @ApiResponse({ status: 200, description: "Payment retrieved successfully" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  findOne(@Param("id") id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post("methods")
  @ApiOperation({ summary: "Create payment method" })
  @ApiResponse({
    status: 201,
    description: "Payment method created successfully",
  })
  createPaymentMethod(@Body() createPaymentMethodDto: any) {
    return this.paymentsService.createPaymentMethod(createPaymentMethodDto);
  }

  @Patch("methods/:id")
  @ApiOperation({ summary: "Update payment method" })
  @ApiResponse({
    status: 200,
    description: "Payment method updated successfully",
  })
  @ApiResponse({ status: 404, description: "Payment method not found" })
  updatePaymentMethod(
    @Param("id") id: string,
    @Body() updatePaymentMethodDto: any
  ) {
    return this.paymentsService.updatePaymentMethod(id, updatePaymentMethodDto);
  }

  @Delete("methods/:id")
  @ApiOperation({ summary: "Delete payment method" })
  @ApiResponse({
    status: 200,
    description: "Payment method deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Payment method not found" })
  deletePaymentMethod(@Param("id") id: string) {
    return this.paymentsService.deletePaymentMethod(id);
  }
}
