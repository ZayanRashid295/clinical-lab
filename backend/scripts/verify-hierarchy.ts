import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log("🔍 Verifying 5-Level Hierarchy Build...");
    
    const categories = await prisma.category.count();
    const products = await prisma.product.count();
    const systems = await prisma.system.count();
    const topics = await prisma.topic.count();
    const subtopics = await prisma.subtopic.count();
    const questions = await prisma.question.count();
    
    console.log(`\n📊 Database Stats:`);
    console.log(`- Categories: ${categories}`);
    console.log(`- Products:   ${products}`);
    console.log(`- Systems:    ${systems}`);
    console.log(`- Topics:     ${topics}`);
    console.log(`- Subtopics:  ${subtopics}`);
    console.log(`- Questions:  ${questions}`);
    
    console.log(`\n🏗️  Hierarchy Sample:`);
    const sampleCategory = await prisma.category.findFirst({
      include: {
        products: {
          include: {
            systems: {
              include: {
                topics: {
                  include: {
                    subtopics: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (sampleCategory) {
      console.log(`✅ Category: ${sampleCategory.name}`);
      const product = sampleCategory.products[0];
      if (product) {
        console.log(`   └─ Product: ${product.name}`);
        const system = product.systems[0];
        if (system) {
          console.log(`      └─ System: ${system.name}`);
          const topic = system.topics[0];
          if (topic) {
            console.log(`         └─ Topic: ${topic.name}`);
            const subtopic = topic.subtopics[0];
            if (subtopic) {
              console.log(`            └─ Subtopic: ${subtopic.name}`);
            }
          }
        }
      }
    }
    
    console.log("\n✨ Verification Complete!");
  } catch (error) {
    console.error("❌ Verification Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
