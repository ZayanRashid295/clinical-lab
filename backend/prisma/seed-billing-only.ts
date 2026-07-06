/**
 * Seed billing plans only (safe for production).
 *
 * Run: npm run prisma:seed:billing
 */
import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { seedBilling } from "./seed-billing";

config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const prisma = new PrismaClient();

  try {
    await seedBilling(prisma);
    console.log("\n✅ Billing plans seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("❌ Billing seed failed:", error);
  process.exit(1);
});
