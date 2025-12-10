import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

/**
 * Script to fix image URLs in the database
 * Replaces localhost URLs with production URLs
 */
async function fixImageUrls() {
  console.log("🔧 Fixing image URLs in database...");

  const oldBaseUrl = process.env.OLD_API_URL || "http://localhost:3000";
  const newBaseUrl = process.env.API_URL || process.env.FRONTEND_URL || "https://api.yourdomain.com";

  console.log(`📝 Replacing: ${oldBaseUrl} → ${newBaseUrl}`);

  // Fix URLs in question stem blocks (HTML content)
  // Note: Prisma JSON filtering is limited, so we fetch all and filter in memory
  const allStemBlocks = await prisma.questionStemBlock.findMany({
    where: {
      type: "TEXT",
    },
  });
  
  const stemBlocks = allStemBlocks.filter((block) => {
    const data = block.data as any;
    return data?.html && typeof data.html === "string" && data.html.includes(oldBaseUrl);
  });

  console.log(`📦 Found ${stemBlocks.length} question stem blocks with old URLs`);

  let updated = 0;
  for (const block of stemBlocks) {
    const data = block.data as any;
    if (data.html && typeof data.html === "string") {
      const updatedHtml = data.html.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
      if (updatedHtml !== data.html) {
        await prisma.questionStemBlock.update({
          where: { id: block.id },
          data: {
            data: {
              ...data,
              html: updatedHtml,
            },
          },
        });
        updated++;
      }
    }
  }

  // Fix URLs in explanation blocks
  const allExplanationBlocks = await prisma.explanationBlock.findMany({
    where: {
      type: "TEXT",
    },
  });
  
  const explanationBlocks = allExplanationBlocks.filter((block) => {
    const data = block.data as any;
    return (data?.html && typeof data.html === "string" && data.html.includes(oldBaseUrl)) ||
           (data?.markdown && typeof data.markdown === "string" && data.markdown.includes(oldBaseUrl));
  });

  console.log(`📦 Found ${explanationBlocks.length} explanation blocks with old URLs`);

  for (const block of explanationBlocks) {
    const data = block.data as any;
    if (data.html && typeof data.html === "string") {
      const updatedHtml = data.html.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
      if (updatedHtml !== data.html) {
        await prisma.explanationBlock.update({
          where: { id: block.id },
          data: {
            data: {
              ...data,
              html: updatedHtml,
            },
          },
        });
        updated++;
      }
    }
    if (data.markdown && typeof data.markdown === "string") {
      const updatedMarkdown = data.markdown.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
      if (updatedMarkdown !== data.markdown) {
        await prisma.explanationBlock.update({
          where: { id: block.id },
          data: {
            data: {
              ...data,
              markdown: updatedMarkdown,
            },
          },
        });
        updated++;
      }
    }
  }

  // Fix URLs in per-answer explanation blocks
  const allPerAnswerBlocks = await prisma.explanationBlock.findMany({
    where: {
      perAnswerId: { not: null },
      type: "TEXT",
    },
  });
  
  const perAnswerBlocks = allPerAnswerBlocks.filter((block) => {
    const data = block.data as any;
    return (data?.html && typeof data.html === "string" && data.html.includes(oldBaseUrl)) ||
           (data?.markdown && typeof data.markdown === "string" && data.markdown.includes(oldBaseUrl));
  });

  console.log(`📦 Found ${perAnswerBlocks.length} per-answer explanation blocks with old URLs`);

  for (const block of perAnswerBlocks) {
    const data = block.data as any;
    if (data.html && typeof data.html === "string") {
      const updatedHtml = data.html.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
      if (updatedHtml !== data.html) {
        await prisma.explanationBlock.update({
          where: { id: block.id },
          data: {
            data: {
              ...data,
              html: updatedHtml,
            },
          },
        });
        updated++;
      }
    }
    if (data.markdown && typeof data.markdown === "string") {
      const updatedMarkdown = data.markdown.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
      if (updatedMarkdown !== data.markdown) {
        await prisma.explanationBlock.update({
          where: { id: block.id },
          data: {
            data: {
              ...data,
              markdown: updatedMarkdown,
            },
          },
        });
        updated++;
      }
    }
  }

  // Fix URLs in IMAGES type blocks
  const imageBlocks = await prisma.questionStemBlock.findMany({
    where: {
      type: "IMAGES",
    },
  });

  console.log(`📦 Found ${imageBlocks.length} image blocks`);

  for (const block of imageBlocks) {
    const data = block.data as any;
    if (data.images && Array.isArray(data.images)) {
      const updatedImages = data.images.map((url: string) => {
        if (typeof url === "string" && url.includes(oldBaseUrl)) {
          return url.replace(new RegExp(oldBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBaseUrl);
        }
        return url;
      });
      
      if (JSON.stringify(updatedImages) !== JSON.stringify(data.images)) {
        await prisma.questionStemBlock.update({
          where: { id: block.id },
          data: {
            data: {
              ...data,
              images: updatedImages,
            },
          },
        });
        updated++;
      }
    }
  }

  console.log(`\n✅ Fixed ${updated} blocks with old image URLs`);
}

fixImageUrls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

