import { PrismaClient } from "@prisma/client";
import { EDUCATION_SEED_PRIMARY_STUDENT_EMAIL } from "./education-users.seed";

/**
 * Seeds learner-facing demo data for the primary student so the dashboard,
 * study planner pages have real, non-empty data on
 * a fresh database.
 */
export async function seedStudentContent(prisma: PrismaClient) {
  console.log("📒 Seeding student-facing demo content…");

  const student = await prisma.user.findUnique({
    where: { email: EDUCATION_SEED_PRIMARY_STUDENT_EMAIL },
  });
  if (!student) {
    console.log(
      `⚠️ Primary student (${EDUCATION_SEED_PRIMARY_STUDENT_EMAIL}) not found; skipping.`
    );
    return;
  }

  // ────── study plan + tasks ──────
  await prisma.studyPlan.updateMany({
    where: { userId: student.id, isActive: true },
    data: { isActive: false },
  });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  const plan = await prisma.studyPlan.create({
    data: {
      userId: student.id,
      name: "30-day USMLE Step 1 sprint",
      description: "Daily mix of reading, practice, and review",
      goal: "Reach 75% accuracy on cardiology and neurology blocks",
      startDate: start,
      endDate: end,
      isActive: true,
    },
  });

  const task = (
    title: string,
    type: "READING" | "PRACTICE" | "REVIEW" | "ASSESSMENT",
    dayOffset: number,
    durationMinutes: number,
    description?: string
  ) => ({
    studyPlanId: plan.id,
    userId: student.id,
    title,
    description,
    type,
    scheduledFor: new Date(start.getTime() + dayOffset * 24 * 3600 * 1000),
    durationMinutes,
  });

  await prisma.studyTask.deleteMany({ where: { userId: student.id } });
  await prisma.studyTask.createMany({
    data: [
      task("Read: Cardiac physiology overview", "READING", -1, 45),
      task("Practice: 20 cardiology MCQs", "PRACTICE", 0, 30),
      task("Review: missed neurology questions", "REVIEW", 1, 30),
      task("Assessment: 40-question timed block", "ASSESSMENT", 2, 60),
      task("Read: Pharmacology — beta blockers", "READING", 3, 30),
      task("Practice: respiratory MCQs", "PRACTICE", 4, 45),
      task("Review: weak topics — endocrine", "REVIEW", 5, 30),
      task("Assessment: emergency medicine block", "ASSESSMENT", 7, 60),
    ],
  });

  // mark some past tasks completed so dashboard shows real progress
  const recent = await prisma.studyTask.findMany({
    where: { userId: student.id, scheduledFor: { lt: new Date() } },
    orderBy: { scheduledFor: "asc" },
  });
  for (const t of recent) {
    await prisma.studyTask.update({
      where: { id: t.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  // ────── bookmarks ──────
  await prisma.bookmark.deleteMany({ where: { userId: student.id } });
  const aFewQuestions = await prisma.question.findMany({
    where: { isActive: true },
    take: 3,
    select: { id: true },
  });
  for (const q of aFewQuestions) {
    await prisma.bookmark.create({
      data: {
        userId: student.id,
        resourceType: "QUESTION",
        resourceId: q.id,
        note: "Revisit before exam",
      },
    });
  }

  console.log("✅ Student demo content seeded.");
}
