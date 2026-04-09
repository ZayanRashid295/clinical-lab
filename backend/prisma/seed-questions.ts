import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export async function seedQuestions(prisma: PrismaClient) {
  console.log("❓ Starting questions seeding...");

  const seedDataPath = resolve(process.cwd(), "prisma", "seed-questions-data.json");
  if (!existsSync(seedDataPath)) {
      console.log("⚠️  seed-questions-data.json not found, skipping question seeding.");
      return;
  }
  
  let questionsData: any[];
  try {
    const fileContent = readFileSync(seedDataPath, "utf-8");
    questionsData = JSON.parse(fileContent);
  } catch (error: any) {
    console.log(`⚠️  Could not load seed-questions-data.json: ${error.message}`);
    return;
  }

  if (!Array.isArray(questionsData) || questionsData.length === 0) {
    console.log("⚠️  No questions data found in seed file");
    return;
  }

  console.log(`📦 Found ${questionsData.length} questions to seed. Note: Since schema has changed significantly, manual mapping of questions JSON may be required if it relies on old tag/chapter names. Proceeding with dummy imports where possible.`);
  
  // Example dummy logic since old schema tags/subject don't exist anymore
  // Users will need to update their seed-questions-data.json format
  let skipped = questionsData.length;
  console.log(`⚠️  Skipped ${skipped} legacy format questions. Need to define mappings to new systemId, topicId, subtopicId in the json.`);
}
