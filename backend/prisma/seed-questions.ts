import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

export async function seedQuestions(prisma: PrismaClient) {
  console.log("❓ Starting questions seeding...");

  // Read the seed data file
  const seedDataPath = resolve(process.cwd(), "prisma", "seed-questions-data.json");
  
  let questionsData: any[];
  try {
    const fileContent = readFileSync(seedDataPath, "utf-8");
    questionsData = JSON.parse(fileContent);
  } catch (error: any) {
    console.log(`⚠️  Could not load seed-questions-data.json: ${error.message}`);
    console.log("   Skipping questions seeding. If you want to seed questions:");
    console.log("   1. Export questions from local DB using export-questions-seed.ts");
    console.log("   2. Copy seed-questions-data.json to prisma/ directory");
    return;
  }

  if (!Array.isArray(questionsData) || questionsData.length === 0) {
    console.log("⚠️  No questions data found in seed file");
    return;
  }

  console.log(`📦 Found ${questionsData.length} questions to seed`);

  // Get all topics with their hierarchy for quick lookup
  const topics = await prisma.topic.findMany({
    include: {
      chapter: {
        include: {
          section: true,
        },
      },
    },
  });

  // Create a map for quick topic lookup: "sectionName/chapterName/topicName" -> topic
  const topicMap = new Map<string, typeof topics[0]>();
  for (const topic of topics) {
    const key = `${topic.chapter?.section?.name}/${topic.chapter?.name}/${topic.name}`;
    topicMap.set(key, topic);
  }

  // Get all product tags
  const productTags = await prisma.productTag.findMany();
  const tagMap = new Map(productTags.map(t => [t.name, t]));

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const qData of questionsData) {
    try {
      // Find topic by hierarchy
      const topicKey = `${qData.sectionName}/${qData.chapterName}/${qData.topicName}`;
      const topic = topicMap.get(topicKey);

      if (!topic) {
        console.log(`⚠️  Topic not found: ${topicKey}`);
        skipped++;
        continue;
      }

      // Find product tag
      const productTag = qData.productTagName 
        ? tagMap.get(qData.productTagName) 
        : null;

      // Check if question already exists (by question text and topic)
      const existing = await prisma.question.findFirst({
        where: {
          question: qData.question,
          topicId: topic.id,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Validate required fields
      if (!qData.question || !qData.question.trim()) {
        console.log(`⚠️  Skipping question with empty text`);
        skipped++;
        continue;
      }

      if (!qData.choices || qData.choices.length === 0) {
        console.log(`⚠️  Skipping question with no choices: ${qData.question.substring(0, 50)}...`);
        skipped++;
        continue;
      }

      // Build data object, only including defined values
      const questionData: any = {
        topicId: topic.id,
        question: qData.question,
        subject: qData.subject || topic.chapter?.name || null,
        system: qData.system || topic.chapter?.section?.name || null,
        difficulty: qData.difficulty || "medium",
        points: qData.points || 1,
        isActive: qData.isActive !== false,
      };

      // Add optional fields only if they have values
      if (productTag?.id) {
        questionData.productTagId = productTag.id;
      }
      if (qData.explanation) {
        questionData.explanation = qData.explanation;
      }
      if (topic.chapterId) {
        questionData.chapterId = topic.chapterId;
      }
      if (topic.chapter?.sectionId) {
        questionData.sectionId = topic.chapter.sectionId;
      }
      if (qData.tags) {
        questionData.tags = qData.tags;
      }

      // Create the question
      await prisma.question.create({
        data: {
          ...questionData,
          
          // Choices (QuestionChoice doesn't have a label field, only text, isCorrect, and order)
          choices: {
            create: qData.choices.map((c: any) => ({
              text: c.text,
              isCorrect: c.isCorrect || false,
              order: c.order !== undefined ? c.order : 0,
            })),
          },
          
          // Question stem blocks
          ...(qData.questionStemBlocks && qData.questionStemBlocks.length > 0 ? {
            questionStemBlocks: {
              create: qData.questionStemBlocks.map((b: any) => ({
                type: b.type,
                order: b.order || 0,
                data: b.data,
              })),
            },
          } : {}),
          
          // Explanation blocks
          ...(qData.explanationBlocks && qData.explanationBlocks.length > 0 ? {
            explanationBlocks: {
              create: qData.explanationBlocks.map((b: any) => ({
                type: b.type,
                order: b.order || 0,
                data: b.data,
              })),
            },
          } : {}),
          
          // Per-answer explanations
          ...(qData.perAnswerExplanations && qData.perAnswerExplanations.length > 0 ? {
            perAnswerExplanations: {
              create: qData.perAnswerExplanations.map((pa: any) => ({
                choiceLabel: pa.choiceLabel,
                blocks: {
                  create: (pa.blocks || []).map((b: any) => ({
                    type: b.type,
                    order: b.order || 0,
                    data: b.data,
                  })),
                },
              })),
            },
          } : {}),
        },
      });

      imported++;
      if (imported % 20 === 0) {
        console.log(`   ✅ Imported ${imported}/${questionsData.length} questions...`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error importing question: ${error.message}`);
      errors++;
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 Questions Seeding Summary:");
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log("=".repeat(80));
}

