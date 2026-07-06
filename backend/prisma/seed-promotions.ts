import { PrismaClient, BillingPromotionType } from "@prisma/client";

export async function seedBetaPromotions(prisma: PrismaClient) {
  const existing = await prisma.billingCoupon.findFirst({
    where: { code: "BETA100" },
  });
  if (existing) {
    console.log("Beta promotions already seeded.");
    return;
  }

  await prisma.billingCoupon.create({
    data: {
      code: "BETA100",
      name: "Beta Access",
      description: "100% off during beta — no payment required",
      type: BillingPromotionType.PERCENTAGE,
      percentOff: 100,
      maxRedemptions: 10000,
      maxRedemptionsPerUser: 1,
      firstTimeOnly: true,
      isActive: true,
    },
  });

  await prisma.billingCoupon.create({
    data: {
      code: "LAUNCH20",
      name: "Launch 20% Off",
      description: "20% off your first billing cycle",
      type: BillingPromotionType.PERCENTAGE,
      percentOff: 20,
      maxRedemptions: 5000,
      maxRedemptionsPerUser: 1,
      firstTimeOnly: true,
      isActive: true,
    },
  });

  console.log("✅ Seeded beta promotions (BETA100, LAUNCH20)");
}
