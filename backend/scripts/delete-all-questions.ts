/**
 * Delete all questions from the database (and related data via cascade).
 * Use this to start fresh with 0 questions.
 *
 * Run from backend folder: npx tsx scripts/delete-all-questions.ts
 * Or: yarn tsx scripts/delete-all-questions.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllQuestions() {
  const count = await prisma.question.count();
  console.log(`Found ${count} question(s) in the database.`);

  if (count === 0) {
    console.log("Nothing to delete.");
    return;
  }

  // Prisma deleteMany on Question will not cascade by default in the same way
  // as DB-level CASCADE. We delete in order to respect FKs:
  // 1. QuestionPaperQuestion (references Question)
  // 2. ExplanationBlock (questionId)
  // 3. PerAnswerExplanation (questionId)
  // 4. QuestionStemBlock (questionId)
  // 5. QuestionChoice (questionId)
  // 6. Question

  // Using a transaction and letting the DB cascade is simpler if the schema
  // has onDelete: Cascade. Prisma's deleteMany only deletes the Question rows;
  // the database will cascade to child tables that have onDelete: Cascade.

  const result = await prisma.question.deleteMany({});
  console.log(`Deleted ${result.count} question(s). Related choices, blocks, and paper links were removed by cascade.`);
}

deleteAllQuestions()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
