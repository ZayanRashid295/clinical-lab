import { PrismaClient } from "@prisma/client";
import { seedPayments } from "./seed-payments";

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("🚀 Starting payment-only seeding...");
    await seedPayments(prisma);
    console.log("\n🎉 Payment seeding completed successfully!");
  } catch (error) {
    console.error("❌ Payment seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
