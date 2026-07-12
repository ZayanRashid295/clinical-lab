/**
 * Seed 5 fixed MCQ review bundles for doctor/student quality testing.
 *
 * System names must match production DB (FCPS/JCAT).
 * Run: npm run prisma:seed:question-review
 */
import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

config({ path: resolve(process.cwd(), ".env") });

/** Exact system names on production server */
export const REVIEW_SYSTEM_NAMES = {
  CVS: "Cardiovascular System (CVS)",
  RHEUMATOLOGY: "Rheumatology",
  HEMATOLOGY: "Hematology",
  NEPHROLOGY: "Nephrology",
  PULMONOLOGY: "Pulmonology",
  DERMATOLOGY: "Dermatology",
  GASTRO: "Gastroenterology (GIT)",
  HEPATOBILIARY: "Hepatobiliary & Pancreatic Diseases",
} as const;

type SystemPick = {
  systemName: string;
  count: number;
};

type BundleConfig = {
  slug: string;
  title: string;
  description: string;
  systems: SystemPick[];
  expectedTotal: number;
};

const BUNDLE_CONFIGS: BundleConfig[] = [
  {
    slug: "cvs",
    title: "Cardiovascular System Review",
    description: "25 MCQs — Cardiovascular System (CVS)",
    expectedTotal: 25,
    systems: [{ systemName: REVIEW_SYSTEM_NAMES.CVS, count: 25 }],
  },
  {
    slug: "hematology-nephrology",
    title: "Hematology + Nephrology Review",
    description: "17 MCQs — Hematology (7) + Nephrology (10)",
    expectedTotal: 17,
    systems: [
      { systemName: REVIEW_SYSTEM_NAMES.HEMATOLOGY, count: 7 },
      { systemName: REVIEW_SYSTEM_NAMES.NEPHROLOGY, count: 10 },
    ],
  },
  {
    slug: "pulmonology-rheumatology",
    title: "Pulmonology + Rheumatology Review",
    description: "16 MCQs — Pulmonology (10) + Rheumatology (6)",
    expectedTotal: 16,
    systems: [
      { systemName: REVIEW_SYSTEM_NAMES.PULMONOLOGY, count: 10 },
      { systemName: REVIEW_SYSTEM_NAMES.RHEUMATOLOGY, count: 6 },
    ],
  },
  {
    slug: "dermatology",
    title: "Dermatology Review",
    description: "25 MCQs — Dermatology",
    expectedTotal: 25,
    systems: [{ systemName: REVIEW_SYSTEM_NAMES.DERMATOLOGY, count: 25 }],
  },
  {
    slug: "gastro-hepatobiliary",
    title: "Gastroenterology + Hepatobiliary Review",
    description:
      "24 MCQs — Gastroenterology (GIT) (12) + Hepatobiliary & Pancreatic Diseases (12)",
    expectedTotal: 24,
    systems: [
      { systemName: REVIEW_SYSTEM_NAMES.GASTRO, count: 12 },
      { systemName: REVIEW_SYSTEM_NAMES.HEPATOBILIARY, count: 12 },
    ],
  },
];

async function resolveSystemId(
  prisma: PrismaClient,
  systemName: string
): Promise<string | null> {
  const exact = await prisma.system.findFirst({
    where: { name: systemName, isActive: true },
    select: { id: true, name: true },
  });
  if (exact) return exact.id;

  const all = await prisma.system.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });
  const normalized = systemName.trim().toLowerCase();
  const ci = all.find((s) => s.name.trim().toLowerCase() === normalized);
  return ci?.id ?? null;
}

async function pickQuestionsForSystem(
  prisma: PrismaClient,
  systemName: string,
  count: number,
  usedQuestionIds: Set<string>
) {
  const systemId = await resolveSystemId(prisma, systemName);
  if (!systemId) {
    console.warn(`  ⚠️  System not found: "${systemName}"`);
    return [] as string[];
  }

  console.log(`  → ${systemName}: loading up to ${count} questions`);

  const questions = await prisma.question.findMany({
    where: {
      isActive: true,
      systemId,
      id: { notIn: [...usedQuestionIds] },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  const picked = questions.slice(0, count).map((q) => q.id);
  if (picked.length < count) {
    console.warn(
      `  ⚠️  "${systemName}": wanted ${count}, found ${picked.length}`
    );
  }
  return picked;
}

export async function seedQuestionReviewBundles(prisma: PrismaClient) {
  console.log("📝 Seeding question review bundles (production system names)…");

  const globalUsed = new Set<string>();
  let totalQuestions = 0;

  for (const config of BUNDLE_CONFIGS) {
    console.log(`\nBundle: ${config.slug} — ${config.title}`);

    const questionIds: string[] = [];
    for (const pick of config.systems) {
      const ids = await pickQuestionsForSystem(
        prisma,
        pick.systemName,
        pick.count,
        globalUsed
      );
      for (const id of ids) {
        if (!globalUsed.has(id)) {
          globalUsed.add(id);
          questionIds.push(id);
        }
      }
    }

    totalQuestions += questionIds.length;

    if (questionIds.length !== config.expectedTotal) {
      console.warn(
        `  ⚠️  Bundle total ${questionIds.length} (expected ${config.expectedTotal})`
      );
    }

    const bundle = await prisma.questionReviewBundle.upsert({
      where: { slug: config.slug },
      update: {
        title: config.title,
        description: config.description,
        isActive: true,
      },
      create: {
        slug: config.slug,
        title: config.title,
        description: config.description,
        isActive: true,
      },
    });

    await prisma.questionReviewBundleItem.deleteMany({
      where: { bundleId: bundle.id },
    });

    if (questionIds.length) {
      await prisma.questionReviewBundleItem.createMany({
        data: questionIds.map((questionId, index) => ({
          bundleId: bundle.id,
          questionId,
          order: index + 1,
        })),
      });
    }

    console.log(`  ✅ ${questionIds.length} questions linked`);
  }

  console.log(
    `\n✅ Review bundles ready — ${totalQuestions} total questions across 5 URLs (target: 107)`
  );
  if (totalQuestions !== 107) {
    console.warn(`⚠️  Expected 107 questions total, got ${totalQuestions}`);
  }

  console.log("\nShare these paths (append your domain):");
  for (const c of BUNDLE_CONFIGS) {
    console.log(`  /qa-review/${c.slug}`);
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedQuestionReviewBundles(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
