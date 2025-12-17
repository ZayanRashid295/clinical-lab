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
  HttpCode,
  Req,
  RawBodyRequest,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Request } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Process payment" })
  @ApiResponse({ status: 201, description: "Payment processed successfully" })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    @Query("sortOrder") sortOrder?: string
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payment by ID" })
  @ApiResponse({ status: 200, description: "Payment retrieved successfully" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  findOne(@Param("id") id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(":id/sync")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Manually sync payment status from Stripe" })
  @ApiResponse({
    status: 200,
    description: "Payment synced successfully",
  })
  async syncPayment(@Param("id") id: string) {
    return this.paymentsService.syncPaymentFromStripe(id);
  }

  @Post("methods")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create payment method" })
  @ApiResponse({
    status: 201,
    description: "Payment method created successfully",
  })
  createPaymentMethod(@Body() createPaymentMethodDto: any) {
    return this.paymentsService.createPaymentMethod(createPaymentMethodDto);
  }

  @Patch("methods/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete payment method" })
  @ApiResponse({
    status: 200,
    description: "Payment method deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Payment method not found" })
  deletePaymentMethod(@Param("id") id: string) {
    return this.paymentsService.deletePaymentMethod(id);
  }

  // Stripe webhook endpoint
  // NOTE: This endpoint should NOT use JwtAuthGuard - Stripe sends webhooks without auth
  // Security is handled via signature verification instead
  @Post("webhook/stripe")
  @HttpCode(200)
  @ApiOperation({ summary: "Stripe webhook endpoint" })
  @ApiResponse({ status: 200, description: "Webhook received" })
  @ApiResponse({ status: 401, description: "Invalid webhook signature" })
  async handleStripeWebhook(
    @Req() req: Request,
    @Body() body: any
  ) {
    const signature = req.headers["stripe-signature"] as string | undefined;
    
    // Try to get raw body if available (requires app configuration for raw body parsing)
    // For production: configure Express to provide raw body for this route
    // For dev/testing: we'll accept parsed body and verify if signature is provided
    const rawBody = (req as any).rawBody;
    const payload = rawBody || (body ? JSON.stringify(body) : null);

    if (!payload) {
      throw new Error("Missing webhook payload");
    }

    return this.paymentsService.handleStripeWebhook(payload, signature);
  }
}
