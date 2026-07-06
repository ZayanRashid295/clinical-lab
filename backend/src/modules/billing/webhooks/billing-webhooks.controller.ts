import { Controller, Headers, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { BillingWebhooksService } from "./billing-webhooks.service";

@ApiTags("billing-webhooks")
@Controller("billing/webhooks")
export class BillingWebhooksController {
  constructor(private webhooksService: BillingWebhooksService) {}

  @Post("stripe")
  async stripe(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("stripe-signature") signature: string
  ) {
    const payload = req.rawBody ?? req.body;
    return this.webhooksService.handleStripeWebhook(
      typeof payload === "string" ? payload : JSON.stringify(payload),
      signature
    );
  }
}
