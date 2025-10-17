import { PrismaClient } from "@prisma/client";
import { seedLearningCases } from "./seed-learning-cases";
import { seedBase } from "./seed-base";
import { seedUSMLE } from "./seed-usmle";
import { seedPayments } from "./seed-payments";

async function main() {
  const prisma = new PrismaClient();

  try {
    // Seed base data first (users, roles, etc.)
    await seedBase(prisma);

    // Seed payments (requires users to exist)
    await seedPayments(prisma);

    // Seed other data
    // await seedLearningCases(prisma);
    // await seedUSMLE(prisma);

    console.log("\n🎉 All seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
