import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

/**
 * Script to fix image paths - ensures all image URLs have /uploads/ prefix
 */
async function fixImagePaths() {
  console.log("🔧 Fixing image paths in database...\n");

  const baseUrl = process.env.API_URL || process.env.FRONTEND_URL || "https://uworld-zayan.org";
  let totalFixed = 0;

  // Fix QuestionStemBlocks with IMAGES type
  console.log("1️⃣ Fixing QuestionStemBlocks (IMAGES type)...");
  const imageStemBlocks = await prisma.questionStemBlock.findMany({
    where: { type: "IMAGES" },
  });
  console.log(`   Found ${imageStemBlocks.length} IMAGES blocks`);

  for (const block of imageStemBlocks) {
    const data = block.data as any;
    if (data.images && Array.isArray(data.images)) {
      let updated = false;
      const updatedImages = data.images.map((url: string) => {
        if (typeof url === "string") {
          // If URL is just a filename, add /uploads/ prefix
          if (url.match(/^\d+-[\w-]+\.(png|jpg|jpeg|gif|webp)$/i)) {
            updated = true;
            return `${baseUrl}/uploads/${url}`;
          }
          // If URL has localhost but missing /uploads/, fix it
          if (url.includes("localhost") && !url.includes("/uploads/")) {
            updated = true;
            return url.replace(/localhost:\d+/, baseUrl).replace(/\/(\d+-[\w-]+\.(png|jpg|jpeg|gif|webp))/i, '/uploads/$1');
          }
          // If URL has baseUrl but missing /uploads/, add it
          if (url.includes(baseUrl) && !url.includes("/uploads/") && url.match(/\/(\d+-[\w-]+\.(png|jpg|jpeg|gif|webp))/i)) {
            updated = true;
            return url.replace(/\/(\d+-[\w-]+\.(png|jpg|jpeg|gif|webp))/i, '/uploads/$1');
          }
        }
        return url;
      });

      if (updated) {
        await prisma.questionStemBlock.update({
          where: { id: block.id },
          data: { data: { ...data, images: updatedImages } },
        });
        totalFixed++;
        console.log(`   ✅ Fixed block ${block.id}: ${JSON.stringify(updatedImages)}`);
      }
    }
  }

  // Fix QuestionStemBlocks with TEXT type (HTML content)
  console.log("\n2️⃣ Fixing QuestionStemBlocks (TEXT type with HTML)...");
  const textStemBlocks = await prisma.questionStemBlock.findMany({
    where: { type: "TEXT" },
  });

  for (const block of textStemBlocks) {
    const data = block.data as any;
    let updated = false;
    const newData: any = { ...data };

    if (data.html && typeof data.html === "string") {
      // Fix image URLs in HTML
      const imagePattern = /(src=["'])([^"']*?)(\d+-[\w-]+\.(png|jpg|jpeg|gif|webp))([^"']*?)(["'])/gi;
      const fixedHtml = data.html.replace(imagePattern, (match, prefix, before, filename, ext, after, suffix) => {
        // If it's just a filename or missing /uploads/
        if (!before.includes("/uploads/") && !before.includes("http")) {
          updated = true;
          return `${prefix}${baseUrl}/uploads/${filename}${suffix}`;
        }
        // If it has localhost
        if (before.includes("localhost")) {
          updated = true;
          const url = before + filename;
          return `${prefix}${url.replace(/http:\/\/localhost:\d+/, baseUrl).replace(/\/(\d+-[\w-]+\.(png|jpg|jpeg|gif|webp))/i, '/uploads/$1')}${suffix}`;
        }
        return match;
      });
      if (updated) {
        newData.html = fixedHtml;
      }
    }

    if (updated) {
      await prisma.questionStemBlock.update({
        where: { id: block.id },
        data: { data: newData },
      });
      totalFixed++;
      console.log(`   ✅ Fixed TEXT block ${block.id}`);
    }
  }

  // Fix ExplanationBlocks with IMAGES type
  console.log("\n3️⃣ Fixing ExplanationBlocks (IMAGES type)...");
  const imageExplanationBlocks = await prisma.explanationBlock.findMany({
    where: { type: "IMAGES" },
  });
  console.log(`   Found ${imageExplanationBlocks.length} IMAGES blocks`);

  for (const block of imageExplanationBlocks) {
    const data = block.data as any;
    if (data.images && Array.isArray(data.images)) {
      let updated = false;
      const updatedImages = data.images.map((url: string) => {
        if (typeof url === "string") {
          if (url.match(/^\d+-[\w-]+\.(png|jpg|jpeg|gif|webp)$/i)) {
            updated = true;
            return `${baseUrl}/uploads/${url}`;
          }
          if (url.includes("localhost") && !url.includes("/uploads/")) {
            updated = true;
            return url.replace(/localhost:\d+/, baseUrl).replace(/\/(\d+-[\w-]+\.(png|jpg|jpeg|gif|webp))/i, '/uploads/$1');
          }
          if (url.includes(baseUrl) && !url.includes("/uploads/") && url.match(/\/(\d+-[\w-]+\.(png|jpg|jpeg|gif|webp))/i)) {
            updated = true;
            return url.replace(/\/(\d+-[\w-]+\.(png|jpg|jpeg|gif|webp))/i, '/uploads/$1');
          }
        }
        return url;
      });

      if (updated) {
        await prisma.explanationBlock.update({
          where: { id: block.id },
          data: { data: { ...data, images: updatedImages } },
        });
        totalFixed++;
        console.log(`   ✅ Fixed explanation block ${block.id}`);
      }
    }
  }

  // Sample check
  console.log("\n4️⃣ Sample check - showing one fixed question:");
  const sample = await prisma.question.findFirst({
    where: {
      questionStemBlocks: {
        some: { type: "IMAGES" },
      },
    },
    include: {
      questionStemBlocks: {
        where: { type: "IMAGES" },
        take: 1,
      },
    },
  });

  if (sample && sample.questionStemBlocks.length > 0) {
    const block = sample.questionStemBlocks[0];
    const data = block.data as any;
    console.log(`   Question: ${sample.question.substring(0, 50)}...`);
    console.log(`   Image URLs: ${JSON.stringify(data.images, null, 2)}`);
  }

  console.log(`\n✅ Total blocks fixed: ${totalFixed}`);
}

fixImagePaths()
  .catch(console.error)
  .finally(() => prisma.$disconnect());







