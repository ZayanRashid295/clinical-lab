import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
// import { seedLearningCases } from "./seed-learning-cases";
import { seedBase } from "./seed-base";
import { seedUSMLE } from "./seed-usmle";
import { seedBilling } from "./seed-billing";
import { seedBetaPromotions } from "./seed-promotions";
import { seedQuestions } from "./seed-questions";
import { seedCategories } from "./seed-categories";
import { seedStudentContent } from "./seed-student-content";
import { seedLaunch } from "./seed-launch";
import { seedFaculty } from "./seed-faculty";

// Load .env file from the backend directory (parent of prisma folder)
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const prisma = new PrismaClient();

  try {
    // Seed base data first (users, roles, etc.)
    await seedBase(prisma);

    // Seed billing plans
    await seedBilling(prisma);
    await seedBetaPromotions(prisma);

    // Seed categories hierarchy first
    await seedCategories(prisma);

    // Seed content hierarchy (Product → Sections → Chapters → Topics) for question creation
    await seedUSMLE(prisma);

    // Demo notes / flashcards / study tasks / bookmarks for the primary student
    await seedStudentContent(prisma);

    // Launch-time seeds: achievements catalogue, mock exams, welcome discussion, public study group
    await seedLaunch(prisma);

    await seedFaculty(prisma);

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
