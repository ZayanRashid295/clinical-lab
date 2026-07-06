import { BillingInterval, BillingPromotionType } from "@prisma/client";
import {
  calculateDiscountAmount,
  buildPromotionQuote,
  getPlanPrice,
} from "./promotion-pricing.util";

describe("Promotion pricing", () => {
  const plan = {
    id: "p1",
    name: "Pro",
    monthlyPrice: 39.99,
    yearlyPrice: 399.99,
    currency: "USD",
  };

  it("calculates 100% discount as free checkout", () => {
    const quote = buildPromotionQuote(plan, BillingInterval.MONTHLY, {
      id: "c1",
      code: "BETA100",
      name: "Beta",
      type: BillingPromotionType.PERCENTAGE,
      description: null,
      percentOff: 100,
      amountOff: null,
      maxDiscountAmount: null,
    });
    expect(quote.originalAmount).toBe(39.99);
    expect(quote.discountAmount).toBe(39.99);
    expect(quote.finalAmount).toBe(0);
    expect(quote.requiresPayment).toBe(false);
  });

  it("calculates 20% partial discount", () => {
    const quote = buildPromotionQuote(plan, BillingInterval.MONTHLY, {
      id: "c2",
      code: "LAUNCH20",
      name: "Launch",
      type: BillingPromotionType.PERCENTAGE,
      description: null,
      percentOff: 20,
      amountOff: null,
      maxDiscountAmount: null,
    });
    expect(quote.discountAmount).toBe(8);
    expect(quote.finalAmount).toBe(31.99);
    expect(quote.requiresPayment).toBe(true);
  });

  it("caps fixed discount at original price", () => {
    const discount = calculateDiscountAmount(19.99, {
      type: BillingPromotionType.FIXED_AMOUNT,
      percentOff: null,
      amountOff: 50,
      maxDiscountAmount: null,
    });
    expect(discount).toBe(19.99);
  });

  it("uses yearly price for yearly interval", () => {
    expect(getPlanPrice(plan, BillingInterval.YEARLY)).toBe(399.99);
  });
});
