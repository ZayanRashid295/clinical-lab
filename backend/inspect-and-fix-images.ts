import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

/**
 * Script to inspect and fix image URLs in the database
 */
async function inspectAndFixImages() {
  console.log("🔍 Inspecting image storage in database...\n");

  const oldBaseUrl = process.env.OLD_API_URL || "http://localhost:3000";
  const newBaseUrl = process.env.API_URL || process.env.FRONTEND_URL || "https://uworld-zayan.org";

  console.log(`📝 Will replace: ${oldBaseUrl} → ${newBaseUrl}\n`);

  let totalFixed = 0;

  // 1. Check QuestionStemBlocks with IMAGES type
  console.log("1️⃣ Checking QuestionStemBlocks (IMAGES type)...");
  const imageStemBlocks = await prisma.questionStemBlock.findMany({
    where: { type: "IMAGES" },
    include: { question: { select: { id: true, question: true } } },
  });
  console.log(`   Found ${imageStemBlocks.length} IMAGES blocks in question stems`);

  for (const block of imageStemBlocks) {
    const data = block.data as any;
    if (data.images && Array.isArray(data.images)) {
      const hasOldUrl = data.images.some((url: any) => 
        typeof url === "string" && url.includes(oldBaseUrl)
      );
      
      if (hasOldUrl) {
        console.log(`   📸 Found old URLs in question ${block.questionId.substring(0, 8)}...`);
        const updatedImages = data.images.map((url: string) => {
          if (typeof url === "string" && url.includes(oldBaseUrl)) {
            return url.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
          }
          return url;
        });
        
        await prisma.questionStemBlock.update({
          where: { id: block.id },
          data: { data: { ...data, images: updatedImages } },
        });
        totalFixed++;
        console.log(`   ✅ Fixed question stem block ${block.id}`);
      }
    }
  }

  // 2. Check QuestionStemBlocks with TEXT type (HTML content)
  console.log("\n2️⃣ Checking QuestionStemBlocks (TEXT type with HTML)...");
  const textStemBlocks = await prisma.questionStemBlock.findMany({
    where: { type: "TEXT" },
  });
  
  const blocksWithOldUrls = textStemBlocks.filter((block) => {
    const data = block.data as any;
    return (data?.html && typeof data.html === "string" && data.html.includes(oldBaseUrl)) ||
           (data?.markdown && typeof data.markdown === "string" && data.markdown.includes(oldBaseUrl));
  });
  
  console.log(`   Found ${blocksWithOldUrls.length} TEXT blocks with old URLs`);

  for (const block of blocksWithOldUrls) {
    const data = block.data as any;
    let updated = false;
    const newData: any = { ...data };

    if (data.html && typeof data.html === "string" && data.html.includes(oldBaseUrl)) {
      newData.html = data.html.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
      updated = true;
    }
    if (data.markdown && typeof data.markdown === "string" && data.markdown.includes(oldBaseUrl)) {
      newData.markdown = data.markdown.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
      updated = true;
    }

    if (updated) {
      await prisma.questionStemBlock.update({
        where: { id: block.id },
        data: { data: newData },
      });
      totalFixed++;
    }
  }

  // 3. Check ExplanationBlocks with IMAGES type
  console.log("\n3️⃣ Checking ExplanationBlocks (IMAGES type)...");
  const imageExplanationBlocks = await prisma.explanationBlock.findMany({
    where: { type: "IMAGES" },
  });
  console.log(`   Found ${imageExplanationBlocks.length} IMAGES blocks in explanations`);

  for (const block of imageExplanationBlocks) {
    const data = block.data as any;
    if (data.images && Array.isArray(data.images)) {
      const hasOldUrl = data.images.some((url: any) => 
        typeof url === "string" && url.includes(oldBaseUrl)
      );
      
      if (hasOldUrl) {
        const updatedImages = data.images.map((url: string) => {
          if (typeof url === "string" && url.includes(oldBaseUrl)) {
            return url.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
          }
          return url;
        });
        
        await prisma.explanationBlock.update({
          where: { id: block.id },
          data: { data: { ...data, images: updatedImages } },
        });
        totalFixed++;
        console.log(`   ✅ Fixed explanation block ${block.id}`);
      }
    }
  }

  // 4. Check ExplanationBlocks with TEXT type
  console.log("\n4️⃣ Checking ExplanationBlocks (TEXT type)...");
  const textExplanationBlocks = await prisma.explanationBlock.findMany({
    where: { type: "TEXT" },
  });
  
  const explanationBlocksWithOldUrls = textExplanationBlocks.filter((block) => {
    const data = block.data as any;
    return (data?.html && typeof data.html === "string" && data.html.includes(oldBaseUrl)) ||
           (data?.markdown && typeof data.markdown === "string" && data.markdown.includes(oldBaseUrl));
  });
  
  console.log(`   Found ${explanationBlocksWithOldUrls.length} TEXT blocks with old URLs`);

  for (const block of explanationBlocksWithOldUrls) {
    const data = block.data as any;
    let updated = false;
    const newData: any = { ...data };

    if (data.html && typeof data.html === "string" && data.html.includes(oldBaseUrl)) {
      newData.html = data.html.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
      updated = true;
    }
    if (data.markdown && typeof data.markdown === "string" && data.markdown.includes(oldBaseUrl)) {
      newData.markdown = data.markdown.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
      updated = true;
    }

    if (updated) {
      await prisma.explanationBlock.update({
        where: { id: block.id },
        data: { data: newData },
      });
      totalFixed++;
    }
  }

  // 5. Sample inspection - show what a question with images looks like
  console.log("\n5️⃣ Sample inspection - Finding a question with images...");
  const sampleQuestion = await prisma.question.findFirst({
    where: {
      questionStemBlocks: {
        some: {
          type: "IMAGES",
        },
      },
    },
    include: {
      questionStemBlocks: {
        where: { type: "IMAGES" },
        take: 1,
      },
    },
  });

  if (sampleQuestion && sampleQuestion.questionStemBlocks.length > 0) {
    const block = sampleQuestion.questionStemBlocks[0];
    const data = block.data as any;
    console.log(`   📋 Sample question ID: ${sampleQuestion.id}`);
    console.log(`   📋 Question: ${sampleQuestion.question.substring(0, 60)}...`);
    console.log(`   📋 Image block data:`, JSON.stringify(data, null, 2));
  }

  console.log(`\n✅ Total blocks fixed: ${totalFixed}`);
  console.log("\n💡 If images still don't show:");
  console.log("   1. Check browser console for 404 errors");
  console.log("   2. Verify image files exist: ls -la public/uploads/");
  console.log("   3. Test image URL: curl -I https://uworld-zayan.org/uploads/FILENAME.png");
  console.log("   4. Check Nginx config has /uploads/ location block");
}

inspectAndFixImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());







