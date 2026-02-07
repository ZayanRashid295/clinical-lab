import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
// import { seedLearningCases } from "./seed-learning-cases";
import { seedBase } from "./seed-base";
import { seedUSMLE } from "./seed-usmle";
import { seedPayments } from "./seed-payments";
import { seedQuestions } from "./seed-questions";

// Load .env file from the backend directory (parent of prisma folder)
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const prisma = new PrismaClient();

  try {
    // Seed base data first (users, roles, etc.)
    await seedBase(prisma);

    // Seed payments (requires users to exist)
    await seedPayments(prisma);

    // Seed content hierarchy (Product → Sections → Chapters → Topics) for question creation
    await seedUSMLE(prisma);

    // Seed other data
    // await seedLearningCases(prisma);
    // Dummy/sample questions disabled – use question generator or import only
    // await seedQuestions(prisma);

    console.log("\n🎉 All seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
