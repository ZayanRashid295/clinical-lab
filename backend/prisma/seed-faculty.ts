import {
  FacultyAssignmentProgressStatus,
  FacultyAssignmentStatus,
  InstitutionCaseStatus,
  InstitutionMemberResolvedVia,
  InstitutionMemberStatus,
  MedprepMode,
  NotificationType,
  PrismaClient,
  StudentActivityType,
} from "@prisma/client";
import { ChatRole } from "@prisma/client";

const INSTITUTION_NAME = "MedPrep Clinical College";
const EMAIL_DOMAIN = "clinicallab.test";

export async function seedFaculty(prisma: PrismaClient) {
  console.log("🏫 Seeding faculty dashboard (institution, cases, assignments, messages)…");

  const institution = await prisma.institution.upsert({
    where: { name: INSTITUTION_NAME },
    update: {
      emailDomains: [EMAIL_DOMAIN],
      requireInstitutionMatch: false,
      isActive: true,
      description: "Demo institution for MedPrepAI faculty dashboard",
    },
    create: {
      name: INSTITUTION_NAME,
      emailDomains: [EMAIL_DOMAIN],
      requireInstitutionMatch: false,
      isActive: true,
      description: "Demo institution for MedPrepAI faculty dashboard",
      email: `admin@${EMAIL_DOMAIN}`,
    },
  });

  const facultyUser = await prisma.user.findUnique({
    where: { email: "faculty@clinicallab.test" },
  });
  const studentUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "student@clinicallab.test",
          "learner@clinicallab.test",
          "scholar@clinicallab.test",
        ],
      },
    },
  });

  if (!facultyUser) {
    console.warn("⚠️ faculty@clinicallab.test not found — run seed-base first");
    return;
  }

  await prisma.facultyProfile.upsert({
    where: { userId: facultyUser.id },
    update: {
      institutionId: institution.id,
      title: "Course Director",
      department: "Internal Medicine",
      isActive: true,
    },
    create: {
      userId: facultyUser.id,
      institutionId: institution.id,
      title: "Course Director",
      department: "Internal Medicine",
      isActive: true,
    },
  });

  for (const student of studentUsers) {
    await prisma.institutionMember.upsert({
      where: { userId: student.id },
      update: {
        institutionId: institution.id,
        status: InstitutionMemberStatus.ACTIVE,
        primaryFacultyUserId: facultyUser.id,
      },
      create: {
        institutionId: institution.id,
        userId: student.id,
        status: InstitutionMemberStatus.ACTIVE,
        resolvedVia: InstitutionMemberResolvedVia.DOMAIN,
        primaryFacultyUserId: facultyUser.id,
      },
    });

    await prisma.facultyStudentAssignment.upsert({
      where: {
        facultyUserId_studentUserId: {
          facultyUserId: facultyUser.id,
          studentUserId: student.id,
        },
      },
      update: {},
      create: {
        institutionId: institution.id,
        facultyUserId: facultyUser.id,
        studentUserId: student.id,
        assignedBy: facultyUser.id,
      },
    });
  }

  const learningCase = await prisma.institutionCase.upsert({
    where: { id: "seed_inst_case_learning_copd" },
    update: {
      institutionId: institution.id,
      status: InstitutionCaseStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      id: "seed_inst_case_learning_copd",
      institutionId: institution.id,
      createdByFacultyId: facultyUser.id,
      mode: MedprepMode.LEARNING,
      title: "COPD Exacerbation — Faculty Case",
      specialty: "Pulmonology",
      difficulty: "medium",
      disease: "COPD exacerbation",
      diseaseName: "COPD exacerbation",
      symptoms: ["persistent cough", "shortness of breath", "wheezing"],
      history: ["30 pack-year smoking history", "chronic productive cough"],
      labs: { spirometry: "FEV1 55% predicted" },
      patientProfile: {
        name: "Robert Chen",
        age: 62,
        gender: "Male",
        occupation: "Retired teacher",
      },
      learningObjectives:
        "Practice focused HPI and smoking history for COPD exacerbation.",
      status: InstitutionCaseStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const practiceCase = await prisma.institutionCase.upsert({
    where: { id: "seed_inst_case_practice_abd" },
    update: {
      institutionId: institution.id,
      status: InstitutionCaseStatus.PUBLISHED,
    },
    create: {
      id: "seed_inst_case_practice_abd",
      institutionId: institution.id,
      createdByFacultyId: facultyUser.id,
      mode: MedprepMode.PRACTICE,
      title: "Acute Abdominal Pain — Faculty Case",
      specialty: "General Medicine",
      difficulty: "hard",
      disease: "Acute appendicitis",
      diseaseName: "Acute appendicitis",
      symptoms: ["right lower quadrant pain", "nausea", "low-grade fever"],
      history: ["pain started periumbilical then migrated"],
      labs: { wbc: "14.2", crp: "elevated" },
      patientProfile: {
        name: "Maria Lopez",
        age: 24,
        gender: "Female",
        occupation: "College student",
      },
      status: InstitutionCaseStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const questionSet = await prisma.institutionQuestionSet.upsert({
    where: { id: "seed_inst_qset_cardio_week1" },
    update: { institutionId: institution.id, isPublished: true },
    create: {
      id: "seed_inst_qset_cardio_week1",
      institutionId: institution.id,
      createdByFacultyId: facultyUser.id,
      title: "Cardiology Week 1 — Faculty MCQs",
      description: "Institution-only practice questions",
      isPublished: true,
    },
  });

  await prisma.institutionQuestion.upsert({
    where: { id: "seed_inst_q1" },
    update: { institutionId: institution.id, isActive: true },
    create: {
      id: "seed_inst_q1",
      institutionId: institution.id,
      createdByFacultyId: facultyUser.id,
      setId: questionSet.id,
      question:
        "A 58-year-old with chest pain and diaphoresis. First test to order in ED?",
      explanation: "ECG within 10 minutes is standard for suspected ACS.",
      choices: [
        { text: "Chest X-ray", isCorrect: false },
        { text: "12-lead ECG", isCorrect: true },
        { text: "D-dimer", isCorrect: false },
        { text: "Abdominal ultrasound", isCorrect: false },
      ],
      difficulty: "medium",
      tags: ["cardiology", "emergency"],
    },
  });

  await prisma.institutionQuestion.upsert({
    where: { id: "seed_inst_q2" },
    update: { institutionId: institution.id },
    create: {
      id: "seed_inst_q2",
      institutionId: institution.id,
      createdByFacultyId: facultyUser.id,
      setId: questionSet.id,
      question: "Best initial step for stable angina evaluation?",
      explanation: "Stress testing or CTA depending on guidelines and risk.",
      choices: [
        { text: "Immediate PCI", isCorrect: false },
        { text: "Exercise stress test", isCorrect: true },
        { text: "Empiric antibiotics", isCorrect: false },
        { text: "Thyroid panel only", isCorrect: false },
      ],
      difficulty: "easy",
      tags: ["cardiology"],
    },
  });

  const dueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const assignment = await prisma.facultyAssignment.upsert({
    where: { id: "seed_faculty_assignment_1" },
    update: {
      institutionId: institution.id,
      status: FacultyAssignmentStatus.PUBLISHED,
      publishedAt: new Date(),
      dueAt,
    },
    create: {
      id: "seed_faculty_assignment_1",
      institutionId: institution.id,
      createdByFacultyId: facultyUser.id,
      title: "Week 2 — COPD case + Cardiology MCQs",
      instructions:
        "Complete the COPD learning case and review the cardiology question set before Friday.",
      type: "MIXED",
      status: FacultyAssignmentStatus.PUBLISHED,
      publishedAt: new Date(),
      dueAt,
      items: {
        create: [
          {
            itemType: "CASE",
            medprepMode: MedprepMode.LEARNING,
            institutionCaseId: learningCase.id,
            sortOrder: 0,
          },
          {
            itemType: "MCQ_SET",
            institutionQuestionSetId: questionSet.id,
            sortOrder: 1,
          },
        ],
      },
    },
    include: { items: true },
  });

  const welcomePreview =
    "Welcome to MedPrep Clinical College. Reach out anytime about assignments or cases.";
  const dueLabel = dueAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  for (const student of studentUsers) {
    await prisma.notification.deleteMany({
      where: {
        userId: student.id,
        type: {
          in: [
            NotificationType.ASSIGNMENT_PUBLISHED,
            NotificationType.FACULTY_MESSAGE,
            NotificationType.ASSIGNMENT_DUE,
          ],
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: student.id,
        type: NotificationType.ASSIGNMENT_PUBLISHED,
        title: "New faculty assignment",
        message: `${assignment.title} has been assigned to you. Due ${dueLabel}.`,
        data: {
          assignmentId: assignment.id,
          route: "/assignments",
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: student.id,
        type: NotificationType.FACULTY_MESSAGE,
        title: `Message from Dr. ${facultyUser.firstName} ${facultyUser.lastName}`,
        message: welcomePreview,
        data: {
          facultyUserId: facultyUser.id,
          route: "/messages",
        },
      },
    });

    await prisma.facultyAssignmentProgress.upsert({
      where: {
        assignmentId_studentUserId: {
          assignmentId: assignment.id,
          studentUserId: student.id,
        },
      },
      update: {},
      create: {
        assignmentId: assignment.id,
        studentUserId: student.id,
        status:
          student.email === "student@clinicallab.test"
            ? FacultyAssignmentProgressStatus.IN_PROGRESS
            : FacultyAssignmentProgressStatus.NOT_STARTED,
      },
    });

    const existingThread = await prisma.facultyStudentThread.findUnique({
      where: {
        institutionId_facultyUserId_studentUserId: {
          institutionId: institution.id,
          facultyUserId: facultyUser.id,
          studentUserId: student.id,
        },
      },
    });

    if (!existingThread) {
      const room = await prisma.chatRoom.create({
        data: {
          name: "Faculty advisory",
          type: "FACULTY_STUDENT",
          participants: {
            create: [
              { userId: facultyUser.id, role: ChatRole.ADMIN },
              { userId: student.id, role: ChatRole.MEMBER },
            ],
          },
          messages: {
            create: [
              {
                senderId: facultyUser.id,
                content:
                  "Welcome to MedPrep Clinical College. Reach out anytime about assignments or cases.",
              },
              ...(student.email === "student@clinicallab.test"
                ? [
                    {
                      senderId: student.id,
                      content:
                        "Thank you — I started the COPD case assignment.",
                    },
                  ]
                : []),
            ],
          },
        },
      });

      await prisma.facultyStudentThread.create({
        data: {
          institutionId: institution.id,
          facultyUserId: facultyUser.id,
          studentUserId: student.id,
          chatRoomId: room.id,
        },
      });
    }

    await prisma.studentActivityEvent.create({
      data: {
        institutionId: institution.id,
        userId: student.id,
        type: StudentActivityType.LOGIN,
        summary: "Seeded login activity",
      },
    });

    if (student.email === "student@clinicallab.test") {
      await prisma.studentActivityEvent.create({
        data: {
          institutionId: institution.id,
          userId: student.id,
          type: StudentActivityType.ASSIGNMENT_OPENED,
          summary: `Opened: ${assignment.title}`,
          metadata: { assignmentId: assignment.id },
        },
      });
    }
  }

  // Extra published practice case not in assignment
  void practiceCase;

  console.log(`✅ Faculty seed: ${INSTITUTION_NAME} (${studentUsers.length} students)`);
}
