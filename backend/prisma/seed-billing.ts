import { PrismaClient } from "@prisma/client";

const DEFAULT_FEATURES = {
  starter: [
    { key: "qbank.access", name: "QBank Access", enabled: true },
    { key: "study.notes", name: "Study Notes", enabled: true },
  ],
  pro: [
    { key: "qbank.access", name: "QBank Access", enabled: true },
    { key: "study.notes", name: "Study Notes", enabled: true },
    { key: "study.flashcards", name: "Flashcards", enabled: true },
    { key: "study.planner", name: "Study Planner", enabled: true },
    { key: "aitutor.chat", name: "AI Tutor", enabled: true, limit: 50 },
  ],
  enterprise: [
    { key: "qbank.access", name: "QBank Access", enabled: true },
    { key: "study.notes", name: "Study Notes", enabled: true },
    { key: "study.flashcards", name: "Flashcards", enabled: true },
    { key: "study.planner", name: "Study Planner", enabled: true },
    { key: "aitutor.chat", name: "AI Tutor", enabled: true, limit: 500 },
    { key: "medprepai.modes", name: "MedPrep AI Modes", enabled: true },
    { key: "api.access", name: "API Access", enabled: true },
  ],
};

export async function seedBilling(prisma: PrismaClient) {
  const existing = await prisma.billingPlan.count();
  if (existing > 0) {
    console.log("Billing plans already seeded, skipping.");
    return;
  }

  const plans = [
    {
      name: "Free",
      description: "Basic access with limited features",
      monthlyPrice: 0,
      yearlyPrice: 0,
      trialEnabled: false,
      trialDurationDays: 0,
      featuresJson: [],
      displayOrder: 0,
      isDefault: true,
      isPublic: true,
      isPopular: false,
    },
    {
      name: "Starter",
      description: "Essential study tools for exam prep",
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      trialEnabled: true,
      trialDurationDays: 14,
      featuresJson: DEFAULT_FEATURES.starter,
      displayOrder: 1,
      isPopular: false,
    },
    {
      name: "Pro",
      description: "Full access with AI tutor and study planner",
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      trialEnabled: true,
      trialDurationDays: 14,
      featuresJson: DEFAULT_FEATURES.pro,
      displayOrder: 2,
      isPopular: true,
    },
    {
      name: "Enterprise",
      description: "Unlimited access for power users and teams",
      monthlyPrice: 79.99,
      yearlyPrice: 799.99,
      trialEnabled: true,
      trialDurationDays: 30,
      featuresJson: DEFAULT_FEATURES.enterprise,
      displayOrder: 3,
      isPopular: false,
    },
  ];

  for (const plan of plans) {
    await prisma.billingPlan.create({
      data: {
        ...plan,
        currency: "USD",
        isActive: true,
        isPublic: plan.name !== "Free",
      },
    });
  }

  console.log(`✅ Seeded ${plans.length} billing plans`);
}
