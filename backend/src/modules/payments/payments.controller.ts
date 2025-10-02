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
  @ApiOperation({ summary: "Get all payments" })
  @ApiResponse({ status: 200, description: "Payments retrieved successfully" })
  findAll() {
    return this.paymentsService.findAll();
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
