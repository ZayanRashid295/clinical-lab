import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthWithBlacklistGuard } from "../../auth/guards/jwt-auth-with-blacklist.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { BillingPromotionsService } from "./billing-promotions.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";
import { QueryPromotionDto } from "./dto/query-promotion.dto";
import { PromotionQuoteDto } from "./dto/promotion-quote.dto";

@ApiTags("billing-promotions")
@Controller("billing/promotions")
export class BillingPromotionsController {
  constructor(private promotionsService: BillingPromotionsService) {}

  @Post("quote")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard)
  quote(@Request() req: any, @Body() dto: PromotionQuoteDto) {
    const userId = req.user.userId || req.user.id;
    return this.promotionsService.quote(
      dto.planId,
      dto.billingInterval,
      dto.promotionCode,
      userId
    );
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  findAll(@Query() query: QueryPromotionDto) {
    return this.promotionsService.findAll(query);
  }

  @Get(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  findOne(@Param("id") id: string) {
    return this.promotionsService.findById(id);
  }

  @Get(":id/redemptions")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  redemptions(@Param("id") id: string) {
    return this.promotionsService.getRedemptions(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  create(@Request() req: any, @Body() dto: CreatePromotionDto) {
    const adminId = req.user.userId || req.user.id;
    return this.promotionsService.create(dto, adminId);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  update(@Request() req: any, @Param("id") id: string, @Body() dto: UpdatePromotionDto) {
    const adminId = req.user.userId || req.user.id;
    return this.promotionsService.update(id, dto, adminId);
  }

  @Post(":id/duplicate")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  duplicate(@Request() req: any, @Param("id") id: string) {
    const adminId = req.user.userId || req.user.id;
    return this.promotionsService.duplicate(id, adminId);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  archive(@Request() req: any, @Param("id") id: string) {
    const adminId = req.user.userId || req.user.id;
    return this.promotionsService.archive(id, adminId);
  }
}
