import { PrismaClient } from "@prisma/client";
import { seedLearningCases } from "./seed-learning-cases";
import { seedBase } from "./seed-base";

async function main() {
  const prisma = new PrismaClient();
  await seedBase(prisma);
  await seedLearningCases(prisma);
}
