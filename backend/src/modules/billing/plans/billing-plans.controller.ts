import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthWithBlacklistGuard } from "../../auth/guards/jwt-auth-with-blacklist.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { BillingPlansService } from "./billing-plans.service";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";

@ApiTags("billing-plans")
@Controller("billing/plans")
export class BillingPlansController {
  constructor(private plansService: BillingPlansService) {}

  @Get("public")
  findPublic() {
    return this.plansService.findPublic();
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  findAll() {
    return this.plansService.findAll(true);
  }

  @Get(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  findOne(@Param("id") id: string) {
    return this.plansService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  update(@Param("id") id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthWithBlacklistGuard, RolesGuard)
  @Roles("ADMIN", "SUPERADMIN")
  remove(@Param("id") id: string) {
    return this.plansService.remove(id);
  }
}
