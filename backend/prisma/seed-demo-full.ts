/**
 * Full demo / dummy data for MedPrepAI + Clinical Lab learner features.
 *
 * Populates (for the primary student by default):
 * - All 4 MedPrep modes (Practice, Learning, Evaluation, Shadow)
 * - Dashboard stats (QBank papers, answered questions, study plan progress)
 * - Study (notes, flashcards, reviews, goals, study tasks)
 * - Achievements (unlocks + points + streak)
 * - Community (discussions + replies)
 * - Study groups (multiple groups, members, posts)
 * - Help & feedback (tickets + staff replies)
 * - Mock exam attempts, AI tutor thread, question report
 *
 * Run:  npm run prisma:seed:demo
 *       npm run prisma:seed:demo -- --reset
 *       npm run prisma:seed:demo -- --email=learner@clinicallab.test
 */
import { config } from "dotenv";
import { resolve } from "path";
import {
  FeedbackCategory,
  FeedbackStatus,
  FlashcardRating,
  GoalMetric,
  MedprepConversationStatus,
  MedprepMessageRole,
  MedprepMode,
  MockExamAttemptStatus,
  PrismaClient,
  StudyTaskStatus,
} from "@prisma/client";
import { EDUCATION_SEED_PRIMARY_STUDENT_EMAIL } from "./education-users.seed";
import { seedLaunch } from "./seed-launch";
import { seedStudentContent } from "./seed-student-content";

config({ path: resolve(process.cwd(), ".env") });

const DEMO_META = { seedDemo: "full-v1" } as const;
const DEMO_PREFIX = "[Demo]";

export type SeedDemoFullOptions = {
  /** Target student email (default: primary education student). */
  email?: string;
  /** Remove prior demo-tagged rows for this user before seeding. */
  reset?: boolean;
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 3600 * 1000);
}

async function findStudent(prisma: PrismaClient, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`User not found: ${email}. Run npm run prisma:seed first.`);
  }
  return user;
}

async function findAdmin(prisma: PrismaClient) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: "admin@clinicallab.test" },
        { email: "superadmin@clinicallab.test" },
      ],
    },
  });
}

/** Remove rows created by a previous demo-full run for this user. */
async function cleanupDemoData(prisma: PrismaClient, userId: string) {
  console.log("   🧹 Cleaning prior demo-tagged data…");

  const convos = await prisma.medprepConversation.findMany({
    where: { userId },
    select: { id: true, metadata: true, title: true },
  });
  const demoConvoIds = convos
    .filter(
      (c) =>
        c.title?.startsWith(DEMO_PREFIX) ||
        (c.metadata &&
          typeof c.metadata === "object" &&
          (c.metadata as { seedDemo?: string }).seedDemo === DEMO_META.seedDemo),
    )
    .map((c) => c.id);

  if (demoConvoIds.length) {
    await prisma.medprepConversation.deleteMany({
      where: { id: { in: demoConvoIds } },
    });
  }

  await prisma.feedbackTicket.deleteMany({
    where: { userId, subject: { startsWith: DEMO_PREFIX } },
  });

  await prisma.discussion.deleteMany({
    where: { authorId: userId, title: { startsWith: DEMO_PREFIX } },
  });

  const demoGroups = await prisma.studyGroup.findMany({
    where: { name: { startsWith: DEMO_PREFIX } },
    select: { id: true },
  });
  if (demoGroups.length) {
    await prisma.studyGroup.deleteMany({
      where: { id: { in: demoGroups.map((g) => g.id) } },
    });
  }

  await prisma.goal.deleteMany({
    where: { userId, title: { startsWith: DEMO_PREFIX } },
  });

  const demoPapers = await prisma.questionPaper.findMany({
    where: { userId, name: { startsWith: DEMO_PREFIX } },
    select: { id: true },
  });
  if (demoPapers.length) {
    await prisma.mockExamAttempt.deleteMany({
      where: { questionPaperId: { in: demoPapers.map((p) => p.id) } },
    });
    await prisma.questionPaperQuestion.deleteMany({
      where: { questionPaperId: { in: demoPapers.map((p) => p.id) } },
    });
    await prisma.questionPaper.deleteMany({
      where: { id: { in: demoPapers.map((p) => p.id) } },
    });
  }

  await prisma.aiTutorConversation.deleteMany({
    where: { userId, title: { startsWith: DEMO_PREFIX } },
  });

  await prisma.questionReport.deleteMany({
    where: { reporterId: userId, details: { startsWith: DEMO_PREFIX } },
  });
}

async function seedMedPrepAllModes(prisma: PrismaClient, userId: string) {
  console.log("   🩺 MedPrep AI — 4 modes…");

  const modes: {
    mode: MedprepMode;
    slug: string;
    title: string;
    caseId: string;
    specialty: string;
    completed: boolean;
  }[] = [
    {
      mode: MedprepMode.PRACTICE,
      slug: "practice",
      title: "Chest pain — independent practice",
      caseId: "demo-practice-chest-pain",
      specialty: "Cardiology",
      completed: true,
    },
    {
      mode: MedprepMode.LEARNING,
      slug: "learning",
      title: "Dyspnea — guided learning",
      caseId: "demo-learning-dyspnea",
      specialty: "Pulmonology",
      completed: true,
    },
    {
      mode: MedprepMode.EVALUATION,
      slug: "evaluation",
      title: "Abdominal pain — AI evaluation",
      caseId: "demo-eval-abdominal",
      specialty: "Gastroenterology",
      completed: true,
    },
    {
      mode: MedprepMode.SHADOW,
      slug: "shadow",
      title: "Pediatric fever — shadow observation",
      caseId: "demo-shadow-peds-fever",
      specialty: "Pediatrics",
      completed: false,
    },
    {
      mode: MedprepMode.PRACTICE,
      slug: "practice-active",
      title: "Headache — in progress",
      caseId: "demo-practice-headache",
      specialty: "Neurology",
      completed: false,
    },
  ];

  for (const spec of modes) {
    const started = daysAgo(spec.completed ? 5 : 0);
    const completedAt = spec.completed ? daysAgo(4) : null;

    const convo = await prisma.medprepConversation.create({
      data: {
        userId,
        mode: spec.mode,
        caseId: spec.caseId,
        title: `${DEMO_PREFIX} ${spec.title}`,
        isGeneratedCase: true,
        status: spec.completed
          ? MedprepConversationStatus.COMPLETED
          : MedprepConversationStatus.ACTIVE,
        score: spec.completed ? 78 + Math.floor(Math.random() * 15) : null,
        startedAt: started,
        completedAt,
        metadata: {
          ...DEMO_META,
          frontendMode: spec.slug,
          specialty: spec.specialty,
          difficulty: "intermediate",
        },
        messages: {
          create: [
            {
              role: MedprepMessageRole.STUDENT,
              content: "Hello, what brings you in today?",
              createdAt: hoursAgo(4),
            },
            {
              role: MedprepMessageRole.PATIENT,
              content:
                "I've had worsening symptoms over the past two days and wanted to get checked.",
              createdAt: hoursAgo(3.9),
            },
            {
              role: MedprepMessageRole.STUDENT,
              content: "Can you describe the pain — location, quality, and severity?",
              createdAt: hoursAgo(3.8),
            },
            {
              role: MedprepMessageRole.PATIENT,
              content:
                "It's mostly central, pressure-like, about 6/10, sometimes radiating to my left arm.",
              createdAt: hoursAgo(3.7),
            },
          ],
        },
      },
    });

    if (spec.mode === MedprepMode.LEARNING || spec.mode === MedprepMode.PRACTICE) {
      await prisma.medprepHintSession.create({
        data: {
          userId,
          conversationId: convo.id,
          caseId: spec.caseId,
          sessionKey: `demo-hint-${convo.id}`,
          totalHintsUsed: spec.mode === MedprepMode.LEARNING ? 3 : 1,
          highImportanceHints: 1,
          mediumImportanceHints: 1,
          lowImportanceHints: 1,
          gradePenalty: 5,
        },
      });
    }

    if (spec.completed && spec.mode !== MedprepMode.SHADOW) {
      await prisma.medprepDiagnosisSubmission.create({
        data: {
          conversationId: convo.id,
          userId,
          caseId: spec.caseId,
          submittedDiagnosis:
            spec.specialty === "Cardiology"
              ? "Acute coronary syndrome"
              : "Community-acquired pneumonia",
          actualDiagnosis:
            spec.specialty === "Cardiology"
              ? "NSTEMI"
              : "Community-acquired pneumonia",
          isCorrect: spec.specialty !== "Gastroenterology",
          isRareCase: false,
          specialty: spec.specialty,
          caseDifficulty: "intermediate",
          submittedAt: completedAt ?? new Date(),
        },
      });

      await prisma.medprepSoapNote.create({
        data: {
          conversationId: convo.id,
          userId,
          subjective:
            "45M presents with progressive symptoms. Reports associated diaphoresis and mild nausea.",
          objective:
            "Vitals stable. Cardiac exam: regular rhythm, no murmurs. Lungs clear bilaterally.",
          assessment:
            "Working diagnosis based on presentation; rule out life-threatening causes.",
          plan: "ECG, troponins, CXR. Admit if positive red flags. Symptom control and follow-up.",
          grade: 82,
          feedback: "Solid structure. Expand differential and document shared decision-making.",
          submittedAt: completedAt ?? new Date(),
          lastSavedAt: completedAt ?? new Date(),
        },
      });
    }
  }
}

async function seedDashboardQbank(prisma: PrismaClient, userId: string) {
  console.log("   📊 Dashboard — QBank & tests…");

  const questions = await prisma.question.findMany({
    where: { isActive: true },
    take: 30,
    select: { id: true },
  });

  if (questions.length < 5) {
    console.log(
      "   ⚠️ Fewer than 5 active questions in DB — skipping QBank papers (run category/USMLE seed).",
    );
    return;
  }

  const makePaper = async (
    name: string,
    type: string,
    answeredCount: number,
    correctRate: number,
  ) => {
    const paper = await prisma.questionPaper.create({
      data: {
        userId,
        name: `${DEMO_PREFIX} ${name}`,
        description: "Auto-generated demo attempt for dashboard widgets",
        type,
        totalQuestions: Math.min(answeredCount, questions.length),
        timeLimit: 40,
      },
    });

    const slice = questions.slice(0, answeredCount);
    for (let i = 0; i < slice.length; i++) {
      const isCorrect = i < Math.floor(slice.length * correctRate);
      await prisma.questionPaperQuestion.create({
        data: {
          questionPaperId: paper.id,
          questionId: slice[i].id,
          order: i,
          userAnswer: isCorrect ? "Correct option" : "Wrong option",
          isCorrect,
          timeSpent: 45 + i * 8,
        },
      });
    }
    return paper;
  };

  await makePaper("Cardiology practice block", "practice", 20, 0.75);
  await makePaper("Mixed systems — in progress", "practice", 12, 0.5);

  const completed = await makePaper("Neurology timed block", "assessment", 15, 0.8);

  const mockExam = await prisma.mockExam.findFirst({
    where: { isPublished: true },
    orderBy: { createdAt: "asc" },
  });

  if (mockExam) {
    const mockPaper = await prisma.questionPaper.create({
      data: {
        userId,
        name: `${DEMO_PREFIX} Mock: ${mockExam.title}`,
        type: "mock_exam",
        totalQuestions: Math.min(10, questions.length),
        timeLimit: mockExam.durationMinutes,
      },
    });

    const mockQs = questions.slice(0, 10);
    let correct = 0;
    for (let i = 0; i < mockQs.length; i++) {
      const ok = i % 4 !== 0;
      if (ok) correct++;
      await prisma.questionPaperQuestion.create({
        data: {
          questionPaperId: mockPaper.id,
          questionId: mockQs[i].id,
          order: i,
          userAnswer: ok ? "A" : "B",
          isCorrect: ok,
          timeSpent: 90,
        },
      });
    }

    await prisma.mockExamAttempt.create({
      data: {
        mockExamId: mockExam.id,
        userId,
        questionPaperId: mockPaper.id,
        status: MockExamAttemptStatus.COMPLETED,
        startedAt: daysAgo(2),
        completedAt: daysAgo(2),
        totalQuestions: mockQs.length,
        correctAnswers: correct,
        scorePercent: Math.round((correct / mockQs.length) * 100),
        timeSpentSeconds: 42 * 60,
      },
    });
  }

  void completed;
}

async function seedAchievementsAndGamification(
  prisma: PrismaClient,
  userId: string,
) {
  console.log("   🏆 Achievements, points & streak…");

  const codes = [
    "FIRST_STEPS",
    "QUESTION_HUNTER",
    "ACCURACY_10",
    "STREAK_3",
    "STREAK_7",
    "DECK_50",
    "FIRST_TEST",
    "DEEP_FOCUS",
    "CONVERSATIONALIST",
    "NOTE_TAKER",
    "TUTOR_FIRST_WORD",
    "PLANNER_FIRST_WIN",
    "GROUP_VOICE",
    "MEDPREP_FIRST_CASE",
    "MEDPREP_CASE_LOAD",
    "MOCK_FIRST_PASS",
    "VOICE_HEARD",
    "SOCIAL_LEARNER",
  ];

  const achievements = await prisma.achievement.findMany({
    where: { code: { in: codes } },
  });

  for (const a of achievements) {
    await prisma.userAchievement.upsert({
      where: {
        userId_achievementId: { userId, achievementId: a.id },
      },
      create: {
        userId,
        achievementId: a.id,
        progress: a.threshold,
        unlockedAt: daysAgo(Math.floor(Math.random() * 14) + 1),
      },
      update: {
        progress: a.threshold,
        unlockedAt: daysAgo(Math.floor(Math.random() * 14) + 1),
      },
    });
  }

  await prisma.userStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak: 12,
      longestStreak: 21,
      lastActiveDate: new Date(),
      freezeTokens: 2,
    },
    update: {
      currentStreak: 12,
      longestStreak: 21,
      lastActiveDate: new Date(),
    },
  });

  await prisma.userPoints.upsert({
    where: { userId },
    create: { userId, total: 520, level: 6 },
    update: { total: 520, level: 6 },
  });

  const ledgerCount = await prisma.pointsLedger.count({
    where: { userId, source: { in: ["ACHIEVEMENT", "MEDPREP", "STUDY_PLAN"] } },
  });
  if (ledgerCount < 3) {
    for (const entry of [
      {
        amount: 25,
        reason: "Achievement: First Steps",
        source: "ACHIEVEMENT",
      },
      {
        amount: 75,
        reason: "MedPrep case completed",
        source: "MEDPREP",
      },
      {
        amount: 15,
        reason: "Study task completed",
        source: "STUDY_PLAN",
      },
    ]) {
      await prisma.pointsLedger.create({
        data: { userId, ...entry },
      });
    }
  }
}

async function seedCommunity(
  prisma: PrismaClient,
  authorId: string,
  peerIds: string[],
) {
  console.log("   💬 Community discussions…");

  const threads = [
    {
      title: `${DEMO_PREFIX} Best approach for cardiology blocks?`,
      body: "How do you structure a 40-q cardio block — systems first or mixed? Share your workflow.",
      replies: [
        "I do 10 min review of missed tags, then timed block.",
        "Sketch the murmur algorithms on paper before starting — helps me a lot.",
      ],
    },
    {
      title: `${DEMO_PREFIX} MedPrep Practice vs Learning mode`,
      body: "When do you switch from Learning to Practice for clerkship prep?",
      replies: [
        "Learning until I can hit 70% on hints-off cases, then Practice for speed.",
      ],
    },
    {
      title: `${DEMO_PREFIX} Shadow mode — teachable moments`,
      body: "The pause-and-ask feature in Shadow mode is great. Anyone using it for small group teaching?",
      replies: [],
    },
  ];

  for (const t of threads) {
    const existing = await prisma.discussion.findFirst({
      where: { title: t.title },
    });
    if (existing) continue;

    const d = await prisma.discussion.create({
      data: {
        authorId,
        title: t.title,
        body: t.body,
        context: "GENERAL",
        pinned: false,
        replyCount: t.replies.length,
        lastActivityAt: new Date(),
      },
    });

    for (let i = 0; i < t.replies.length; i++) {
      const replier = peerIds[i % peerIds.length] ?? authorId;
      await prisma.discussionReply.create({
        data: {
          discussionId: d.id,
          authorId: replier,
          body: t.replies[i],
          isAnswer: i === 0,
        },
      });
    }
  }
}

async function seedStudyGroupsDemo(
  prisma: PrismaClient,
  ownerId: string,
  memberIds: string[],
) {
  console.log("   👥 Study groups…");

  const groups = [
    {
      name: `${DEMO_PREFIX} Step 1 — Daily accountability`,
      description: "Post your daily question count and one takeaway.",
      category: "USMLE",
      icon: "📚",
      color: "bg-primary-600",
    },
    {
      name: `${DEMO_PREFIX} MedPrep case club`,
      description: "Debrief AI cases together after Practice and Shadow sessions.",
      category: "MedPrep",
      icon: "🩺",
      color: "bg-emerald-500",
    },
    {
      name: `${DEMO_PREFIX} Weekend mock marathon`,
      description: "Coordinate half-length mocks and score reports.",
      category: "Mock Exams",
      icon: "⏱️",
      color: "bg-violet-500",
    },
  ];

  for (const g of groups) {
    const existing = await prisma.studyGroup.findFirst({
      where: { name: g.name },
    });
    if (existing) continue;

    const group = await prisma.studyGroup.create({
      data: {
        name: g.name,
        description: g.description,
        category: g.category,
        icon: g.icon,
        color: g.color,
        isPrivate: false,
        ownerId,
        memberCount: Math.min(memberIds.length + 1, 4),
        members: {
          create: [
            { userId: ownerId, role: "OWNER" },
            ...memberIds.slice(0, 3).map((uid) => ({
              userId: uid,
              role: "MEMBER" as const,
            })),
          ],
        },
      },
    });

    await prisma.studyGroupPost.create({
      data: {
        groupId: group.id,
        authorId: ownerId,
        body: "Welcome — share what you're studying this week and one goal for the group.",
        pinned: true,
      },
    });

    if (memberIds[0]) {
      await prisma.studyGroupPost.create({
        data: {
          groupId: group.id,
          authorId: memberIds[0],
          body: "Aiming for 40 questions/day and one MedPrep case in Practice mode.",
        },
      });
    }
  }
}

async function seedFeedbackDemo(
  prisma: PrismaClient,
  userId: string,
  staffId: string | undefined,
) {
  console.log("   📬 Help & feedback tickets…");

  const tickets = [
    {
      subject: `${DEMO_PREFIX} Hint text hard to read in dark mode`,
      body: "On the learning case screen, hint popover contrast is low in dark theme.",
      category: FeedbackCategory.BUG,
      status: FeedbackStatus.IN_PROGRESS,
    },
    {
      subject: `${DEMO_PREFIX} Feature: export SOAP to PDF`,
      body: "Would love a one-click PDF export after SOAP grading for portfolio.",
      category: FeedbackCategory.FEATURE_REQUEST,
      status: FeedbackStatus.RESOLVED,
    },
  ];

  for (const t of tickets) {
    const existing = await prisma.feedbackTicket.findFirst({
      where: { userId, subject: t.subject },
    });
    if (existing) continue;

    const ticket = await prisma.feedbackTicket.create({
      data: {
        userId,
        subject: t.subject,
        body: t.body,
        category: t.category,
        status: t.status,
        lastReplyAt: daysAgo(1),
        closedAt:
          t.status === FeedbackStatus.RESOLVED ? daysAgo(0) : undefined,
      },
    });

    if (staffId) {
      await prisma.feedbackReply.create({
        data: {
          ticketId: ticket.id,
          authorId: staffId,
          isStaff: true,
          body:
            t.status === FeedbackStatus.RESOLVED
              ? "Thanks — we've logged this for a future release. Closing as resolved for now."
              : "Thanks for the report. Engineering is reviewing theme tokens for hint modals.",
        },
      });
    }
  }
}

async function seedGoalsAndStudyExtras(prisma: PrismaClient, userId: string) {
  console.log("   🎯 Goals & study extras…");

  const hasDemoGoal = await prisma.goal.findFirst({
    where: { userId, title: { startsWith: DEMO_PREFIX } },
  });
  if (hasDemoGoal) {
    console.log("   ⏭ Demo goals already present.");
    return;
  }

  const goal = await prisma.goal.create({
    data: {
      userId,
      title: `${DEMO_PREFIX} Answer 30 questions this week`,
      description: "Stay on track for Step 1 cardio block",
      metric: GoalMetric.QUESTIONS_ANSWERED,
      target: 30,
      period: "WEEKLY",
      startDate: daysAgo(7),
      endDate: daysAgo(-7),
      isActive: true,
    },
  });

  const bucket = new Date().toISOString().slice(0, 10);
  await prisma.goalProgress.create({
    data: {
      goalId: goal.id,
      userId,
      bucket,
      value: 22,
      achieved: false,
    },
  });

  const cards = await prisma.flashcard.findMany({
    where: { userId },
    take: 5,
  });
  for (const card of cards) {
    await prisma.flashcardReview.create({
      data: {
        flashcardId: card.id,
        userId,
        rating: FlashcardRating.GOOD,
        intervalDays: 3,
        easeFactor: 2.5,
        reviewedAt: daysAgo(1),
      },
    });
    await prisma.flashcard.update({
      where: { id: card.id },
      data: {
        lastReviewedAt: daysAgo(1),
        repetitions: { increment: 1 },
        status: "REVIEW",
      },
    });
  }

  const plan = await prisma.studyPlan.findFirst({
    where: { userId, isActive: true },
  });
  if (plan) {
    await prisma.studyTask.create({
      data: {
        studyPlanId: plan.id,
        userId,
        title: `${DEMO_PREFIX} MedPrep Practice case debrief`,
        description: "Review SOAP feedback from demo chest pain case",
        type: "REVIEW",
        scheduledFor: daysAgo(-1),
        durationMinutes: 25,
        status: StudyTaskStatus.PENDING,
      },
    });
  }
}

async function seedAiTutorDemo(prisma: PrismaClient, userId: string) {
  console.log("   🤖 AI tutor conversation…");

  const existing = await prisma.aiTutorConversation.findFirst({
    where: { userId, title: { startsWith: DEMO_PREFIX } },
  });
  if (existing) return;

  await prisma.aiTutorConversation.create({
    data: {
      userId,
      title: `${DEMO_PREFIX} Beta-blockers in heart failure`,
      context: "GENERAL",
      lastMessageAt: hoursAgo(2),
      messages: {
        create: [
          {
            role: "USER",
            content: "When are beta-blockers contraindicated in acute HF?",
          },
          {
            role: "ASSISTANT",
            content:
              "In acute decompensated HF with cardiogenic shock or severe bradycardia, beta-blockers are generally held. Once stable/chronic HF with reduced EF, evidence supports careful initiation and titration.",
            model: "gemini-2.5-flash",
          },
          {
            role: "USER",
            content: "What about asthma?",
          },
          {
            role: "ASSISTANT",
            content:
              "Use cardioselective agents with caution; avoid non-selective beta-blockers if reactive airway disease is significant. Coordinate with pulmonology when unsure.",
            model: "gemini-2.5-flash",
          },
        ],
      },
    },
  });
}

async function seedQuestionReportDemo(prisma: PrismaClient, userId: string) {
  const q = await prisma.question.findFirst({ where: { isActive: true } });
  if (!q) return;

  const existing = await prisma.questionReport.findFirst({
    where: { reporterId: userId, questionId: q.id, details: { startsWith: DEMO_PREFIX } },
  });
  if (existing) return;

  await prisma.questionReport.create({
    data: {
      questionId: q.id,
      reporterId: userId,
      reason: "UNCLEAR",
      details: `${DEMO_PREFIX} Stem could clarify whether vitals are at triage or exam room.`,
      status: "OPEN",
    },
  });
}

export async function seedDemoFull(
  prisma: PrismaClient,
  options: SeedDemoFullOptions = {},
) {
  const email = options.email ?? EDUCATION_SEED_PRIMARY_STUDENT_EMAIL;
  const reset = options.reset ?? false;

  console.log(`\n🎭 Seeding full demo data for ${email}…\n`);

  await seedLaunch(prisma);
  await seedStudentContent(prisma);

  const student = await findStudent(prisma, email);
  const admin = await findAdmin(prisma);

  const peers = await prisma.user.findMany({
    where: {
      email: {
        in: ["learner@clinicallab.test", "scholar@clinicallab.test"],
      },
    },
    select: { id: true },
  });

  if (reset) {
    await cleanupDemoData(prisma, student.id);
  }

  const demoConvoCount = await prisma.medprepConversation.count({
    where: { userId: student.id, title: { startsWith: DEMO_PREFIX } },
  });
  if (demoConvoCount > 0 && !reset) {
    console.log(
      `   ⏭ MedPrep demo already present (${demoConvoCount} sessions). Use --reset to replace.`,
    );
  } else {
    await seedMedPrepAllModes(prisma, student.id);
  }

  const demoPaperCount = await prisma.questionPaper.count({
    where: { userId: student.id, name: { startsWith: DEMO_PREFIX } },
  });
  if (demoPaperCount > 0 && !reset) {
    console.log("   ⏭ QBank demo papers already present. Use --reset to replace.");
  } else {
    await seedDashboardQbank(prisma, student.id);
  }
  await seedAchievementsAndGamification(prisma, student.id);
  await seedCommunity(
    prisma,
    student.id,
    peers.map((p) => p.id),
  );
  await seedStudyGroupsDemo(
    prisma,
    student.id,
    peers.map((p) => p.id),
  );
  await seedFeedbackDemo(prisma, student.id, admin?.id);
  await seedGoalsAndStudyExtras(prisma, student.id);
  await seedAiTutorDemo(prisma, student.id);
  await seedQuestionReportDemo(prisma, student.id);

  console.log("\n✅ Full demo seed complete.");
  console.log(`   Log in as: ${email} / password123`);
  console.log("   Look for [Demo] labels in MedPrep, discussions, groups, and feedback.\n");
}

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const emailArg = args.find((a) => a.startsWith("--email="));
  const email = emailArg?.split("=")[1];

  const prisma = new PrismaClient();
  try {
    await seedDemoFull(prisma, { reset, email });
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
