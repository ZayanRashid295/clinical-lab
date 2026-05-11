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

  // Seed new entitlement definitions + link them to packages (additive, keeps old features working).
  const entitlementMap: Record<
    string,
    { key: string; displayName: string; description?: string; type?: any }
  > = {
    "Qbank Access": {
      key: "qbank.access",
      displayName: "Qbank Access",
      description: "Access to the question bank module",
    },
    Flashcards: {
      key: "study.flashcards",
      displayName: "Flashcards",
      description: "Spaced-repetition flashcards access",
    },
    "Study Planner": {
      key: "study.planner",
      displayName: "Study Planner",
      description: "Study planner access",
    },
    Notes: {
      key: "study.notes",
      displayName: "Notes",
      description: "Notes access",
    },
  };

  // AI Tutor quota is enforced in AiTutorService (aitutor.chat entitlement). Users without
  // this entitlement on their package use AI_TUTOR_CHAT_LIMIT_WITHOUT_ENTITLEMENT (default 0).
  await prisma.entitlementDefinition.upsert({
    where: { key: "aitutor.chat" },
    update: {
      displayName: "AI Tutor Chat",
      description: "Chat quota for AI Tutor",
      isActive: true,
      type: "NUMBER_LIMIT" as any,
    },
    create: {
      key: "aitutor.chat",
      displayName: "AI Tutor Chat",
      description: "Chat quota for AI Tutor",
      type: "NUMBER_LIMIT" as any,
      isActive: true,
    },
  });

  // MedPrepAI access + modes (admin can assign these to relevant packages).
  await prisma.entitlementDefinition.upsert({
    where: { key: "medprepai.access" },
    update: {
      displayName: "MedPrepAI Access",
      description: "Access to MedPrepAI module",
      isActive: true,
      type: "BOOLEAN" as any,
    },
    create: {
      key: "medprepai.access",
      displayName: "MedPrepAI Access",
      description: "Access to MedPrepAI module",
      type: "BOOLEAN" as any,
      isActive: true,
    },
  });
  await prisma.entitlementDefinition.upsert({
    where: { key: "medprepai.modes" },
    update: {
      displayName: "MedPrepAI Modes",
      description: "Enabled MedPrepAI modes (SET.items)",
      isActive: true,
      type: "SET" as any,
    },
    create: {
      key: "medprepai.modes",
      displayName: "MedPrepAI Modes",
      description: "Enabled MedPrepAI modes (SET.items)",
      type: "SET" as any,
      isActive: true,
    },
  });

  const entitlementDefs = [];
  for (const f of features) {
    const mapped = entitlementMap[f.name];
    if (!mapped) continue;
    const ent = await prisma.entitlementDefinition.upsert({
      where: { key: mapped.key },
      update: {
        displayName: mapped.displayName,
        description: mapped.description,
        isActive: true,
      },
      create: {
        key: mapped.key,
        displayName: mapped.displayName,
        description: mapped.description,
        // keep these tied to the seeded Qbank product subtype for now
        productSubtypeId: subtype.id,
        type: "BOOLEAN" as any,
        isActive: true,
      },
    });
    entitlementDefs.push(ent);
  }

  for (const pkg of packages) {
    for (const ent of entitlementDefs) {
      await prisma.subscriptionPackageEntitlement.upsert({
        where: {
          subscriptionPackageId_entitlementDefinitionId: {
            subscriptionPackageId: pkg.id,
            entitlementDefinitionId: ent.id,
          },
        },
        update: {
          valueJson: { enabled: true },
        },
        create: {
          subscriptionPackageId: pkg.id,
          entitlementDefinitionId: ent.id,
          valueJson: { enabled: true },
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
