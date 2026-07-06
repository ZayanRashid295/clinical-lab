/**
 * Seed promotion codes only (safe for production).
 *
 * Run: npm run prisma:seed:promotions
 */
import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { seedBetaPromotions } from "./seed-promotions";

config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const prisma = new PrismaClient();

  try {
    await seedBetaPromotions(prisma);
    console.log("\n✅ Promotions seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("❌ Promotions seed failed:", error);
  process.exit(1);
});
