import { PrismaClient } from "@prisma/client";

const categories = [
  {
    name: "Medical",
    slug: "medical",
    icon: "🏥",
    description: "Medical education resources for USMLE, COMLEX, and more",
    order: 0,
    products: [
      { name: "USMLE Step 1", description: "Basic science examination", order: 0 },
      { name: "USMLE Step 2 CK", description: "Clinical knowledge examination", order: 1 },
      { name: "USMLE Step 2 CS", description: "Clinical skills examination", order: 2 },
      { name: "USMLE Step 3", description: "Final licensing examination", order: 3 },
      { name: "COMLEX Level 1", description: "Osteopathic biomedical sciences", order: 4 },
      { name: "COMLEX Level 2", description: "Osteopathic clinical knowledge", order: 5 },
      { name: "Internal Medicine (ABIM)", description: "ABIM board certification prep", order: 6 },
      { name: "Family Medicine (ABFM)", description: "ABFM board certification prep", order: 7 },
      { name: "FCPS Part 1", description: "Fellow of College of Physicians and Surgeons Part 1", order: 8 },
      { name: "JCAT", description: "Joint Clinical Assessment Test", order: 9 },
      { name: "International Clinical QBank", description: "Global clinical question bank", order: 10 },
      { name: "Medical Library", description: "Comprehensive medical reference library", order: 11 },
      { name: "PA (PANCE | PANRE)", description: "Physician Assistant certification", order: 12 },
    ],
  },
  {
    name: "Nursing",
    slug: "nursing",
    icon: "💉",
    description: "Nursing examination preparation resources",
    order: 1,
    products: [
      { name: "NCLEX-RN", description: "Registered Nurse licensing exam", order: 0 },
      { name: "NCLEX-PN", description: "Practical Nurse licensing exam", order: 1 },
    ],
  },
  {
    name: "High School",
    slug: "high-school",
    icon: "🎓",
    description: "High school exam preparation",
    order: 2,
    products: [
      { name: "SAT", description: "Scholastic Assessment Test prep", order: 0 },
      { name: "ACT", description: "American College Testing prep", order: 1 },
      { name: "AP Biology", description: "Advanced Placement Biology", order: 2 },
      { name: "AP Chemistry", description: "Advanced Placement Chemistry", order: 3 },
    ],
  },
  {
    name: "Grad School",
    slug: "grad-school",
    icon: "📚",
    description: "Graduate school entrance exam preparation",
    order: 3,
    products: [
      { name: "GRE", description: "Graduate Record Examinations", order: 0 },
      { name: "MCAT", description: "Medical College Admission Test", order: 1 },
    ],
  },
  {
    name: "Accounting",
    slug: "accounting",
    icon: "📊",
    description: "Accounting certification preparation",
    order: 4,
    products: [
      { name: "CPA", description: "Certified Public Accountant exam", order: 0 },
    ],
  },
  {
    name: "Finance",
    slug: "finance",
    icon: "💰",
    description: "Finance certification preparation",
    order: 5,
    products: [
      { name: "CFA Level 1", description: "Chartered Financial Analyst Level 1", order: 0 },
      { name: "CFA Level 2", description: "Chartered Financial Analyst Level 2", order: 1 },
    ],
  },
  {
    name: "Legal",
    slug: "legal",
    icon: "⚖️",
    description: "Legal examination preparation",
    order: 6,
    products: [
      { name: "Bar Exam", description: "State bar examination prep", order: 0 },
      { name: "LSAT", description: "Law School Admission Test prep", order: 1 },
    ],
  },
];

export async function seedCategories(prisma: PrismaClient) {
  console.log("🌱 Seeding categories and products...\n");

  for (const cat of categories) {
    const { products, ...catData } = cat;

    const createdCat = await prisma.category.upsert({
      where: { slug: catData.slug },
      create: {
        name: catData.name,
        slug: catData.slug,
        icon: catData.icon,
        description: catData.description,
        order: catData.order ?? 0,
        isActive: true,
      },
      update: {
        name: catData.name,
        icon: catData.icon,
        description: catData.description,
        order: catData.order ?? 0,
      },
    });

    console.log(`✅ Category: ${createdCat.name} (${createdCat.id})`);

    for (const product of products) {
      const createdProduct = await prisma.product.upsert({
        where: { name: product.name },
        create: {
          name: product.name,
          description: product.description,
          order: product.order ?? 0,
          isActive: true,
          categoryId: createdCat.id,
        },
        update: {
          categoryId: createdCat.id,
          order: product.order ?? 0,
        },
      });

      console.log(`   📦 Product: ${createdProduct.name}`);
    }
  }
}

