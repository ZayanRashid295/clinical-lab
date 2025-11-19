import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDatabaseContent() {
  try {
    console.log("🔍 Checking Database Content...\n");
    console.log("=".repeat(80));

    // Get all sections (Systems)
    const sections = await prisma.section.findMany({
      where: { isActive: true },
      include: {
        product: {
          select: { name: true },
        },
        chapters: {
          where: { isActive: true },
          include: {
            topics: {
              where: { isActive: true },
              orderBy: { order: "asc" },
            },
            _count: {
              select: { topics: true },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: { order: "asc" },
    });

    console.log(`\n📚 SECTIONS (Systems): ${sections.length}\n`);

    for (const section of sections) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(
        `\n🏛️  SECTION: ${section.name} (ID: ${section.id})`
      );
      console.log(`   Product: ${section.product.name}`);
      console.log(`   Description: ${section.description || "N/A"}`);
      console.log(`   Chapters: ${section._count.chapters}`);

      if (section.chapters.length > 0) {
        console.log(`\n   📖 CHAPTERS (Subjects):`);
        for (const chapter of section.chapters) {
          console.log(`\n      • ${chapter.name} (ID: ${chapter.id})`);
          console.log(`        Topics: ${chapter._count.topics}`);

          if (chapter.topics.length > 0) {
            console.log(`        Topics List:`);
            chapter.topics.forEach((topic, index) => {
              console.log(`          ${index + 1}. ${topic.name}`);
            });
          }
        }
      } else {
        console.log(`   ⚠️  No chapters found for this section`);
      }
    }

    // Summary
    console.log(`\n${"=".repeat(80)}`);
    console.log(`\n📊 SUMMARY:\n`);
    let totalChapters = 0;
    let totalTopics = 0;

    for (const section of sections) {
      totalChapters += section.chapters.length;
      for (const chapter of section.chapters) {
        totalTopics += chapter.topics.length;
      }
    }

    console.log(`   Total Sections: ${sections.length}`);
    console.log(`   Total Chapters: ${totalChapters}`);
    console.log(`   Total Topics: ${totalTopics}`);
    console.log(`\n${"=".repeat(80)}\n`);
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseContent();

