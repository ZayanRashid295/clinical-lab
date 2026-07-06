import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthWithBlacklistGuard } from "../../auth/guards/jwt-auth-with-blacklist.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { BillingSubscriptionsService } from "./billing-subscriptions.service";
import { SubscribeDto } from "./dto/subscribe.dto";
import { ChangePlanDto } from "./dto/change-plan.dto";
import { UpdatePaymentMethodDto } from "./dto/update-payment-method.dto";

@ApiTags("billing")
@Controller("billing")
export class BillingSubscriptionsController {
  constructor(private billingService: BillingSubscriptionsService) {}

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard)
  getMyBilling(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.billingService.getBillingSummary(userId);
  }

  @Get("me/features")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard)
  async getMyFeatures(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    const keys = await this.billingService.getUserFeatures(userId);
    return { features: keys };
  }

  @Post("setup-intent")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard)
  createSetupIntent(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.billingService.createSetupIntent(userId);
  }

  @Post("subscribe")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard)
  subscribe(@Request() req: any, @Body() dto: SubscribeDto) {
    const userId = req.user.userId || req.user.id;
    return this.billingService.subscribe(userId, dto);
  }

  @Post("cancel")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard)
  cancel(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.billingService.cancel(userId);
  }

  @Post("resume")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard)
  resume(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.billingService.resume(userId);
  }

  @Post("change-plan")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard)
  changePlan(@Request() req: any, @Body() dto: ChangePlanDto) {
    const userId = req.user.userId || req.user.id;
    return this.billingService.changePlan(userId, dto);
  }

  @Post("payment-method")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard)
  updatePaymentMethod(@Request() req: any, @Body() dto: UpdatePaymentMethodDto) {
    const userId = req.user.userId || req.user.id;
    return this.billingService.updatePaymentMethod(userId, dto.paymentMethodId);
  }

  @Get("admin/subscriptions")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  listAll() {
    return this.billingService.listAllAdmin();
  }
}
