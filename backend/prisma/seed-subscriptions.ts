import { PrismaClient } from "@prisma/client";
import { EDUCATION_SEED_USERS } from "./education-users.seed";

/**
 * Seeds three subscription packages (Basic / Standard / Premium) on a product subtype
 * and three user subscriptions (first three education seed students).
 */
export async function seedSubscriptions(prisma: PrismaClient) {
  console.log("📋 Seeding subscriptions...");

  const product =
    (await prisma.product.findFirst({
      where: { name: "USMLE Step 1" },
    })) ??
    (await prisma.product.findFirst({
      orderBy: { name: "asc" },
    }));

  if (!product) {
    console.log(
      "⚠️ No product found. Run seed-categories (or seed-usmle) first; skipping subscriptions."
    );
    return;
  }

  const subtype = await prisma.productSubtype.upsert({
    where: {
      productId_name: {
        productId: product.id,
        name: "Qbank",
      },
    },
    update: {},
    create: {
      productId: product.id,
      name: "Qbank",
      description: "Question bank access (seed)",
      isActive: true,
    },
  });

  const packageDefs = [
    {
      name: "Basic",
      description: "90-day Qbank access",
      price: 49.99,
      validityDays: 90,
    },
    {
      name: "Standard",
      description: "180-day Qbank access",
      price: 89.99,
      validityDays: 180,
    },
    {
      name: "Premium",
      description: "365-day Qbank access",
      price: 149.99,
      validityDays: 365,
    },
  ] as const;

  const packages = [];
  for (const def of packageDefs) {
    const pkg = await prisma.subscriptionPackage.upsert({
      where: {
        productSubtypeId_name: {
          productSubtypeId: subtype.id,
          name: def.name,
        },
      },
      update: {
        description: def.description,
        price: def.price,
        validityDays: def.validityDays,
        isActive: true,
      },
      create: {
        productSubtypeId: subtype.id,
        name: def.name,
        description: def.description,
        price: def.price,
        currency: "USD",
        validityDays: def.validityDays,
        isActive: true,
      },
    });
    packages.push(pkg);
  }

  // Ensure the four canonical PackageFeatures exist and link them to packages so
  // backend feature gates (e.g. "Qbank Access") work for paid users.
  const featureDefs = [
    { name: "Qbank Access", description: "Full question bank access" },
    { name: "Flashcards", description: "Spaced-repetition flashcards" },
    { name: "Study Planner", description: "Daily plan + tasks" },
    { name: "Notes", description: "Personal study notes" },
  ];
  const features = [];
  for (const def of featureDefs) {
    const f = await prisma.packageFeatures.upsert({
      where: { name: def.name },
      update: { description: def.description, isActive: true },
      create: {
        name: def.name,
        description: def.description,
        isActive: true,
      },
    });
    features.push(f);
  }
  for (const pkg of packages) {
    for (const f of features) {
      await prisma.subscriptionFeatures.upsert({
        where: {
          subscriptionPackageId_packageFeatureId: {
            subscriptionPackageId: pkg.id,
            packageFeatureId: f.id,
          },
        },
        update: {},
        create: {
          subscriptionPackageId: pkg.id,
          packageFeatureId: f.id,
        },
      });
    }
  }

  const userEmails = EDUCATION_SEED_USERS.filter((u) => u.role === "STUDENT")
    .slice(0, 3)
    .map((u) => u.email);

  const users = await prisma.user.findMany({
    where: { email: { in: [...userEmails] } },
    select: { id: true, email: true },
  });

  if (users.length < 3) {
    console.log(
      `⚠️ Expected 3 seed users (${userEmails.join(", ")}), found ${users.length}. Run seed-base first.`
    );
  }

  const now = new Date();
  let created = 0;

  for (let i = 0; i < Math.min(users.length, packages.length); i++) {
    const user = users[i];
    const pkg = packages[i];
    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + pkg.validityDays);

    const existing = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        subscriptionPackageId: pkg.id,
      },
    });

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          startDate,
          endDate,
          autoRenew: i === 2,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          subscriptionPackageId: pkg.id,
          status: "ACTIVE",
          startDate,
          endDate,
          autoRenew: i === 2,
        },
      });
    }
    created += 1;
  }

  console.log(
    `✅ Subscriptions: ${packages.length} package(s) on "${product.name}" → ${subtype.name}; ${created} user subscription row(s) ensured.`
  );
}
