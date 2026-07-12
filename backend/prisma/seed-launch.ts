import { PrismaClient } from "@prisma/client";
import { EDUCATION_SEED_PRIMARY_STUDENT_EMAIL } from "./education-users.seed";

/**
 * Seeds the launch-time data for the new modules:
 *   • Achievement catalogue
 *   • A few sample mock exams
 *   • A welcome discussion thread
 *   • A public study group every student can join
 *
 * Idempotent — uses upsert wherever it can.
 */
export async function seedLaunch(prisma: PrismaClient) {
  console.log("🚀 Seeding launch-module sample data…");

  await seedAchievements(prisma);
  await seedMockExams(prisma);
  await seedDiscussions(prisma);
  await seedStudyGroup(prisma);

  console.log("✅ Launch-module seeding complete.");
}

// ─── Achievements ──────────────────────────────────────────────────────────
async function seedAchievements(prisma: PrismaClient) {
  const list = [
    // STUDY
    {
      code: "FIRST_STEPS",
      title: "First Steps",
      description: "Answer your first question.",
      category: "STUDY",
      icon: "🚀",
      points: 5,
      threshold: 1,
      metric: "QUESTIONS_ANSWERED",
    },
    {
      code: "QUESTION_HUNTER",
      title: "Question Hunter",
      description: "Answer 50 questions.",
      category: "STUDY",
      icon: "🎯",
      points: 25,
      threshold: 50,
      metric: "QUESTIONS_ANSWERED",
    },
    {
      code: "QUESTION_MASTER",
      title: "Question Master",
      description: "Answer 250 questions.",
      category: "STUDY",
      icon: "🏆",
      points: 100,
      threshold: 250,
      metric: "QUESTIONS_ANSWERED",
    },
    // PROGRESS - correct
    {
      code: "ACCURACY_10",
      title: "On the Mark",
      description: "Get 10 questions correct.",
      category: "PROGRESS",
      icon: "✅",
      points: 15,
      threshold: 10,
      metric: "CORRECT_ANSWERS",
    },
    {
      code: "ACCURACY_100",
      title: "Sharp Shooter",
      description: "Get 100 questions correct.",
      category: "PROGRESS",
      icon: "🎖️",
      points: 50,
      threshold: 100,
      metric: "CORRECT_ANSWERS",
    },
    // STREAK
    {
      code: "STREAK_3",
      title: "Warming Up",
      description: "Maintain a 3-day study streak.",
      category: "STREAK",
      icon: "🔥",
      points: 10,
      threshold: 3,
      metric: "STREAK_DAYS",
    },
    {
      code: "STREAK_7",
      title: "Week One Down",
      description: "Maintain a 7-day study streak.",
      category: "STREAK",
      icon: "🔥",
      points: 30,
      threshold: 7,
      metric: "STREAK_DAYS",
    },
    {
      code: "STREAK_30",
      title: "Iron Will",
      description: "Maintain a 30-day study streak.",
      category: "STREAK",
      icon: "💎",
      points: 200,
      threshold: 30,
      metric: "STREAK_DAYS",
    },
    // MILESTONE - tests
    {
      code: "FIRST_TEST",
      title: "Test Driver",
      description: "Complete your first test.",
      category: "MILESTONE",
      icon: "📝",
      points: 20,
      threshold: 1,
      metric: "TESTS_COMPLETED",
    },
    {
      code: "TEN_TESTS",
      title: "Test Veteran",
      description: "Complete 10 tests.",
      category: "MILESTONE",
      icon: "🏅",
      points: 60,
      threshold: 10,
      metric: "TESTS_COMPLETED",
    },
    // STUDY_MINUTES
    {
      code: "DEEP_FOCUS",
      title: "Deep Focus",
      description:
        "Accumulate 60 minutes of focused time (tests, mocks, timed questions, tracked sessions).",
      category: "STUDY",
      icon: "⏱️",
      points: 15,
      threshold: 60,
      metric: "STUDY_MINUTES",
    },
    {
      code: "TIME_INVESTED",
      title: "Time Invested",
      description: "Reach 300 minutes of tracked study time across the platform.",
      category: "STUDY",
      icon: "⌛",
      points: 50,
      threshold: 300,
      metric: "STUDY_MINUTES",
    },
    // COMMUNITY - discussions
    {
      code: "CONVERSATIONALIST",
      title: "Conversationalist",
      description: "Post your first discussion or reply.",
      category: "COMMUNITY",
      icon: "💬",
      points: 10,
      threshold: 1,
      metric: "DISCUSSION_POSTS",
    },
    // AI Tutor
    {
      code: "TUTOR_FIRST_WORD",
      title: "Office Hours",
      description: "Send your first message to the AI tutor.",
      category: "MASTERY",
      icon: "🤖",
      points: 10,
      threshold: 1,
      metric: "AI_TUTOR_MESSAGES",
    },
    {
      code: "TUTOR_DEEP_DIVE",
      title: "Deep Dive",
      description: "Send 25 messages to the AI tutor.",
      category: "MASTERY",
      icon: "💬",
      points: 40,
      threshold: 25,
      metric: "AI_TUTOR_MESSAGES",
    },
    // Study planner
    {
      code: "PLANNER_FIRST_WIN",
      title: "Checked Off",
      description: "Complete your first study plan task.",
      category: "PROGRESS",
      icon: "✔️",
      points: 12,
      threshold: 1,
      metric: "STUDY_TASKS_COMPLETED",
    },
    {
      code: "PLANNER_STEADY",
      title: "Steady Progress",
      description: "Complete 25 study plan tasks.",
      category: "PROGRESS",
      icon: "📅",
      points: 55,
      threshold: 25,
      metric: "STUDY_TASKS_COMPLETED",
    },
    // Study groups
    {
      code: "GROUP_VOICE",
      title: "Study Hall",
      description: "Post your first message in a study group.",
      category: "COMMUNITY",
      icon: "👥",
      points: 10,
      threshold: 1,
      metric: "STUDY_GROUP_POSTS",
    },
    {
      code: "GROUP_REGULAR",
      title: "Regular",
      description: "Post 20 messages across study groups.",
      category: "COMMUNITY",
      icon: "📣",
      points: 35,
      threshold: 20,
      metric: "STUDY_GROUP_POSTS",
    },
    // MedPrep AI
    {
      code: "MEDPREP_FIRST_CASE",
      title: "White Coat",
      description: "Start your first MedPrep clinical case.",
      category: "MASTERY",
      icon: "🩺",
      points: 15,
      threshold: 1,
      metric: "MEDPREP_CONVERSATIONS",
    },
    {
      code: "MEDPREP_CASE_LOAD",
      title: "Case Load",
      description: "Engage with 15 MedPrep cases.",
      category: "MASTERY",
      icon: "📋",
      points: 75,
      threshold: 15,
      metric: "MEDPREP_CONVERSATIONS",
    },
    // Mock exams
    {
      code: "MOCK_FIRST_PASS",
      title: "Mock Run",
      description: "Complete your first full mock exam attempt.",
      category: "MILESTONE",
      icon: "🎓",
      points: 25,
      threshold: 1,
      metric: "MOCK_EXAMS_COMPLETED",
    },
    {
      code: "MOCK_MARATHONER",
      title: "Mock Marathoner",
      description: "Complete 5 mock exam attempts.",
      category: "MILESTONE",
      icon: "🏁",
      points: 80,
      threshold: 5,
      metric: "MOCK_EXAMS_COMPLETED",
    },
    // QBank quality
    {
      code: "CITIZEN_SCIENTIST",
      title: "Citizen Scientist",
      description: "Submit your first question report to help improve the bank.",
      category: "COMMUNITY",
      icon: "🔬",
      points: 8,
      threshold: 1,
      metric: "QUESTION_REPORTS_SUBMITTED",
    },
    // Help & support
    {
      code: "VOICE_HEARD",
      title: "Your Voice",
      description: "Send your first help-desk or product feedback ticket.",
      category: "COMMUNITY",
      icon: "📬",
      points: 5,
      threshold: 1,
      metric: "FEEDBACK_TICKETS_SUBMITTED",
    },
    // Study groups — membership
    {
      code: "SOCIAL_LEARNER",
      title: "Social Learner",
      description: "Be part of 2 study groups (create or join).",
      category: "COMMUNITY",
      icon: "🤝",
      points: 12,
      threshold: 2,
      metric: "STUDY_GROUPS_JOINED",
    },
  ] as const;

  for (const a of list) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: { ...a },
      create: { ...a },
    });
  }
  console.log(`   • Achievements upserted: ${list.length}`);
}

// ─── Mock exams ─────────────────────────────────────────────────────────────
async function seedMockExams(prisma: PrismaClient) {
  const exams = [
    {
      title: "USMLE Step 1 — Diagnostic Block",
      description:
        "A 40-question warm-up across all systems to gauge your baseline.",
      totalQuestions: 40,
      durationMinutes: 50,
      difficulty: "mixed",
      isPublished: true,
    },
    {
      title: "Cardiology Quick Check",
      description:
        "Focused 20-question block on cardiology fundamentals — perfect for a quick review.",
      totalQuestions: 20,
      durationMinutes: 25,
      difficulty: "medium",
      isPublished: true,
    },
    {
      title: "Half-length Mock — Mixed Systems",
      description:
        "100 questions, 2-hour timer. Simulates the pace of a real exam block.",
      totalQuestions: 100,
      durationMinutes: 120,
      difficulty: "mixed",
      isPublished: true,
    },
  ];

  for (const e of exams) {
    const existing = await prisma.mockExam.findFirst({
      where: { title: e.title },
    });
    if (existing) {
      await prisma.mockExam.update({ where: { id: existing.id }, data: e });
    } else {
      await prisma.mockExam.create({ data: e });
    }
  }
  console.log(`   • Mock exams upserted: ${exams.length}`);
}

// ─── Discussions ────────────────────────────────────────────────────────────
async function seedDiscussions(prisma: PrismaClient) {
  const student = await prisma.user.findUnique({
    where: { email: EDUCATION_SEED_PRIMARY_STUDENT_EMAIL },
  });
  if (!student) return;

  const existing = await prisma.discussion.findFirst({
    where: { authorId: student.id, title: "👋 Welcome to Discussions!" },
  });
  if (existing) return;

  await prisma.discussion.create({
    data: {
      authorId: student.id,
      title: "👋 Welcome to Discussions!",
      body: [
        "Hey everyone — this is the place to ask questions, share study tips and learn from each other.",
        "",
        "A few ground rules:",
        "1. Be respectful and constructive.",
        "2. Search before posting — your question may already be answered.",
        "3. Mark replies as the answer when they help.",
        "",
        "Happy studying!",
      ].join("\n"),
      context: "GENERAL",
      pinned: true,
    },
  });
  console.log("   • Welcome discussion created");
}

// ─── Public study group ─────────────────────────────────────────────────────
async function seedStudyGroup(prisma: PrismaClient) {
  const student = await prisma.user.findUnique({
    where: { email: EDUCATION_SEED_PRIMARY_STUDENT_EMAIL },
  });
  if (!student) return;

  const existing = await prisma.studyGroup.findFirst({
    where: { name: "USMLE Step 1 — Open Group" },
  });
  if (existing) return;

  const group = await prisma.studyGroup.create({
    data: {
      name: "USMLE Step 1 — Open Group",
      description:
        "An open community for anyone preparing for USMLE Step 1. Ask questions, share resources and stay accountable together.",
      category: "USMLE",
      icon: "🩺",
      color: "bg-emerald-500",
      isPrivate: false,
      ownerId: student.id,
      memberCount: 1,
      members: {
        create: { userId: student.id, role: "OWNER" },
      },
    },
  });

  await prisma.studyGroupPost.create({
    data: {
      groupId: group.id,
      authorId: student.id,
      body: "Welcome to the group! Introduce yourself and share what you're working on this week.",
      pinned: true,
    },
  });
  console.log("   • Public study group created");
}
