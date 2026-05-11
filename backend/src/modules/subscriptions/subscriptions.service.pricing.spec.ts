import { SubscriptionsService } from "./subscriptions.service";

describe("SubscriptionsService.calculatePricingQuote", () => {
  const service = new SubscriptionsService({} as any);

  it("returns zero when no entitlements selected", async () => {
    const quote = await service.calculatePricingQuote({
      validityDays: 90,
      currency: "USD",
      entitlements: [],
    });
    expect(quote.total).toBe(0);
    expect(quote.currency).toBe("USD");
  });

  it("prices qbank.access linearly by time", async () => {
    const q30 = await service.calculatePricingQuote({
      validityDays: 30,
      currency: "USD",
      entitlements: [{ key: "qbank.access", valueJson: { enabled: true } }],
    });
    const q90 = await service.calculatePricingQuote({
      validityDays: 90,
      currency: "USD",
      entitlements: [{ key: "qbank.access", valueJson: { enabled: true } }],
    });

    expect(q30.total).toBeGreaterThan(0);
    expect(q90.total).toBeCloseTo(q30.total * 3, 2);
  });

  it("applies a long-term discount for annual validity", async () => {
    const annual = await service.calculatePricingQuote({
      validityDays: 365,
      currency: "USD",
      entitlements: [{ key: "qbank.access", valueJson: { enabled: true } }],
    });
    expect(annual.discount).toBeGreaterThan(0);
    expect(annual.total).toBeLessThan(annual.subtotal);
  });
});

