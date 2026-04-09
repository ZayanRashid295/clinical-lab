import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDatabaseContent() {
  try {
    console.log("🔍 Checking Database Content...\n");
    console.log("=".repeat(80));

    // Get all Products with their Systems, Topics, Subtopics
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        systems: {
          where: { isActive: true },
          include: {
            topics: {
              where: { isActive: true },
              include: {
                subtopics: {
                  where: { isActive: true },
                  orderBy: { order: "asc" }
                },
                _count: {
                  select: { subtopics: true },
                },
              },
              orderBy: { order: "asc" },
            },
            _count: {
              select: { topics: true },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: { systems: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`\n📚 PRODUCTS: ${products.length}\n`);

    for (const product of products) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(
        `\n🏛️  PRODUCT: ${product.name} (ID: ${product.id})`
      );
      console.log(`   Description: ${product.description || "N/A"}`);
      console.log(`   Systems: ${product._count.systems}`);

      if (product.systems.length > 0) {
        console.log(`\n   📖 SYSTEMS:`);
        for (const system of product.systems) {
          console.log(`\n      • ${system.name} (ID: ${system.id})`);
          console.log(`        Topics: ${system._count.topics}`);

          if (system.topics.length > 0) {
            console.log(`        Topics Lst:`);
            system.topics.forEach((topic, index) => {
              console.log(`          ${index + 1}. ${topic.name} (Subtopics: ${topic._count.subtopics})`);
            });
          }
        }
      } else {
        console.log(`   ⚠️  No systems found for this product`);
      }
    }

    // Summary
    console.log(`\n${"=".repeat(80)}`);
    console.log(`\n📊 SUMMARY:\n`);
    let totalSystems = 0;
    let totalTopics = 0;
    let totalSubtopics = 0;

    for (const product of products) {
      totalSystems += product.systems.length;
      for (const system of product.systems) {
        // topics
        totalTopics += system.topics.length;
        for (const topic of system.topics) {
          totalSubtopics += topic.subtopics.length;
        }
      }
    }

    console.log(`   Total Products: ${products.length}`);
    console.log(`   Total Systems: ${totalSystems}`);
    console.log(`   Total Topics: ${totalTopics}`);
    console.log(`   Total Subtopics: ${totalSubtopics}`);
    console.log(`\n${"=".repeat(80)}\n`);
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseContent();
