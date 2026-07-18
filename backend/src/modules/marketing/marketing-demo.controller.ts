import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import {
  CreateMarketingDemoLeadDto,
  MARKETING_DEMO_PACKS,
  type MarketingDemoPack,
} from "./dto/create-marketing-demo-lead.dto";
import { MarketingDemoService } from "./marketing-demo.service";

@ApiTags("marketing-demo")
@Controller("marketing/demo")
export class MarketingDemoController {
  constructor(private readonly marketingDemo: MarketingDemoService) {}

  @Post("leads")
  @ApiOperation({
    summary: "Capture a marketing lead and issue a short-lived demo pack token",
  })
  async createLead(@Body() dto: CreateMarketingDemoLeadDto, @Req() req: Request) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined) ||
      req.ip;
    return this.marketingDemo.createLead(dto, {
      ip,
      userAgent: req.headers["user-agent"],
    });
  }

  @Get("packs/:pack")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Fetch isDemo=true sample questions for a pack (requires demo token)",
  })
  async getPack(
    @Param("pack") pack: string,
    @Headers("authorization") authorization?: string,
  ) {
    if (!MARKETING_DEMO_PACKS.includes(pack as MarketingDemoPack)) {
      throw new UnauthorizedException("Unknown demo pack");
    }
    const token = authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!token) throw new UnauthorizedException("Demo token required");
    this.marketingDemo.verifyDemoToken(token, pack as MarketingDemoPack);
    return this.marketingDemo.getDemoPack(pack as MarketingDemoPack);
  }
}
