/**
 * Seed billing plans + promotion codes only (safe for production).
 *
 * Run: npm run prisma:seed:billing-promotions
 */
import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { seedBilling } from "./seed-billing";
import { seedBetaPromotions } from "./seed-promotions";

config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const prisma = new PrismaClient();

  try {
    await seedBilling(prisma);
    await seedBetaPromotions(prisma);
    console.log("\n✅ Billing plans and promotions seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("❌ Billing/promotions seed failed:", error);
  process.exit(1);
});
