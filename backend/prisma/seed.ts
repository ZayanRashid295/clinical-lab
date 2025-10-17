import { PrismaClient } from "@prisma/client";
import { seedLearningCases } from "./seed-learning-cases";
import { seedBase } from "./seed-base";
import { seedUSMLE } from "./seed-usmle";

async function main() {
  const prisma = new PrismaClient();
  // await seedBase(prisma);
  // await seedLearningCases(prisma);
  await seedUSMLE(prisma);
}

main();
