import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured in environment");
    }

    this.stripe = new Stripe(secretKey, {
      // Keep in sync with your Stripe dashboard API version if needed
      apiVersion: "2024-06-20" as any,
    });
  }

  async createPaymentIntent(params: Stripe.PaymentIntentCreateParams) {
    return this.stripe.paymentIntents.create(params);
  }

  async retrievePaymentIntent(id: string) {
    return this.stripe.paymentIntents.retrieve(id);
  }

  /**
   * Verify Stripe webhook signature
   * @param payload Raw request body as string
   * @param signature Stripe signature from 'stripe-signature' header
   * @param webhookSecret Webhook signing secret from environment
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }
  }
}



