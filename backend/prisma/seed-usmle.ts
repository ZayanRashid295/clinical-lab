import { PrismaClient } from "@prisma/client";

export async function seedUSMLE(prisma: PrismaClient) {
  console.log("🏥 Starting Dummy Product Content database seeding (FCPS-1 / JCAT)...");

  // Create or retrieve Category
  const category = await prisma.category.upsert({
    where: { name: "Medicine & Allied" },
    update: {},
    create: {
      name: "Medicine & Allied",
      description: "FCPS Part 1 Medicine and Allied category",
      isActive: true, slug: 'medicine-allied' },
  });

  // Create Dummy Product
  console.log("📚 Creating Product...");
  const fcpsProduct = await prisma.product.upsert({
    where: { name: "FCPS-1/ JCAT" },
    update: {
      categoryId: category.id,
    },
    create: {
      name: "FCPS-1/ JCAT",
      description: "FCPS-1/ JCAT (Medicine & Allied) product",
      categoryId: category.id,
      isActive: true,
    },
  });

  // Systems
  console.log("📖 Creating systems, topics, and subtopics...");
  const systems = [
    "Cardiovascular System",
    "Hematology",
    "Neurology",
    "Respiratory System",
    "Gastrointestinal System",
    "Endocrinology",
    "Nephrology",
    "Rheumatology",
    "Infectious Diseases",
    "Dermatology",
    "Oncology",
    "Psychiatry"
  ];
  
  for (let i = 0; i < systems.length; i++) {
    const sys = await prisma.system.upsert({
      where: {
        productId_name: {
          productId: fcpsProduct.id,
          name: systems[i],
        },
      },
      update: {},
      create: {
        productId: fcpsProduct.id,
        name: systems[i],
        order: i + 1,
        isActive: true,
      },
    });

    if (systems[i] === "Cardiovascular System") {
      const topics = [
        "Acute Chest Pain",
        "Heart Failure",
        "Arrhythmias",
        "Valvular Heart Disease",
        "Hypertension",
        "Infective Endocarditis",
        "Pericardial Diseases",
        "Aortic Dissection",
        "Peripheral Vascular Disease",
        "Congenital Heart Disease"
      ];
      for (let j = 0; j < topics.length; j++) {
        const top = await prisma.topic.upsert({
            where: {
                systemId_name: {
                    systemId: sys.id,
                    name: topics[j]
                }
            },
            update: {},
            create: {
                systemId: sys.id,
                name: topics[j],
                order: j + 1,
                isActive: true,
            }
        });

        if (topics[j] === "Acute Chest Pain") {
          const subtopics = ["History & Presentation", "Diagnosis/ECG", "Biomarkers", "Acute Management"];
          for (let k = 0; k < subtopics.length; k++) {
            await prisma.subtopic.upsert({
              where: {
                topicId_name: {
                  topicId: top.id,
                  name: subtopics[k]
                }
              },
              update: {},
              create: {
                topicId: top.id,
                name: subtopics[k],
                order: k + 1,
                isActive: true,
              }
            });
          }
        }
      }
    }
  }

  console.log("✅ Content Hierarchy Seeded Successfully!");
}
