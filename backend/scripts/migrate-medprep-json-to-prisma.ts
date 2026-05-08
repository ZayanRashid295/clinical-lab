import { promises as fs } from "fs";
import path from "path";
import { PrismaClient, MedprepMode } from "@prisma/client";

type LegacyConversation = {
  id: string;
  status?: "ACTIVE" | "COMPLETED" | "ABANDONED";
  startedAt?: string;
  completedAt?: string;
  interventionCount?: number;
  userId: string;
  caseId?: string;
  caseInstanceId?: string;
  messages?: Array<{
    id: string;
    role: "STUDENT" | "PATIENT" | "DOCTOR";
    content: string;
    isIntervention?: boolean;
    relevanceScore?: number;
    createdAt?: string;
  }>;
};

type LegacyDiagnosis = {
  id: string;
  conversationId: string;
  studentId: string;
  submittedDiagnosis: string;
  actualDiagnosis: string;
  isCorrect: boolean;
  submittedAt?: string;
  caseMetadata?: {
    isRare?: boolean;
    specialty?: string;
    difficulty?: string;
  };
};

type LegacySoap = {
  id: string;
  conversationId: string;
  studentId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  aiGeneratedSOAP?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  grade?: number;
  feedback?: string;
  submittedAt?: string;
};

type LegacyDb = {
  conversations?: LegacyConversation[];
  diagnosisSubmissions?: LegacyDiagnosis[];
  soapNotes?: LegacySoap[];
};

const prisma = new PrismaClient();

async function main() {
  const dbPath = path.join(
    process.cwd(),
    "..",
    "frontend-next",
    ".data",
    "medprep-db.json"
  );
  const report = {
    conversationsMigrated: 0,
    messagesMigrated: 0,
    diagnosisMigrated: 0,
    soapMigrated: 0,
    skippedOrphans: 0,
  };

  const raw = await fs.readFile(dbPath, "utf-8");
  const legacy = JSON.parse(raw || "{}") as LegacyDb;
  const legacyConversations = legacy.conversations || [];
  const legacyDiagnosis = legacy.diagnosisSubmissions || [];
  const legacySoap = legacy.soapNotes || [];

  for (const conv of legacyConversations) {
    const upserted = await prisma.medprepConversation.upsert({
      where: { id: conv.id },
      update: {
        userId: conv.userId,
        mode: MedprepMode.PRACTICE,
        caseId: conv.caseId,
        caseInstanceId: conv.caseInstanceId,
        status: conv.status || "ACTIVE",
        interventionCount: conv.interventionCount || 0,
        startedAt: conv.startedAt ? new Date(conv.startedAt) : new Date(),
        completedAt: conv.completedAt ? new Date(conv.completedAt) : null,
      },
      create: {
        id: conv.id,
        userId: conv.userId,
        mode: MedprepMode.PRACTICE,
        caseId: conv.caseId,
        caseInstanceId: conv.caseInstanceId,
        status: conv.status || "ACTIVE",
        interventionCount: conv.interventionCount || 0,
        startedAt: conv.startedAt ? new Date(conv.startedAt) : new Date(),
        completedAt: conv.completedAt ? new Date(conv.completedAt) : null,
      },
    });
    report.conversationsMigrated += 1;

    for (const msg of conv.messages || []) {
      await prisma.medprepConversationMessage.upsert({
        where: { id: msg.id },
        update: {
          conversationId: upserted.id,
          role: msg.role,
          content: msg.content,
          isIntervention: msg.isIntervention || false,
          relevanceScore: msg.relevanceScore,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
        },
        create: {
          id: msg.id,
          conversationId: upserted.id,
          role: msg.role,
          content: msg.content,
          isIntervention: msg.isIntervention || false,
          relevanceScore: msg.relevanceScore,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
        },
      });
      report.messagesMigrated += 1;
    }
  }

  const conversationIds = new Set(legacyConversations.map((c) => c.id));

  for (const diagnosis of legacyDiagnosis) {
    if (!conversationIds.has(diagnosis.conversationId)) {
      report.skippedOrphans += 1;
      continue;
    }
    await prisma.medprepDiagnosisSubmission.upsert({
      where: { id: diagnosis.id },
      update: {
        conversationId: diagnosis.conversationId,
        userId: diagnosis.studentId,
        submittedDiagnosis: diagnosis.submittedDiagnosis,
        actualDiagnosis: diagnosis.actualDiagnosis,
        isCorrect: diagnosis.isCorrect,
        submittedAt: diagnosis.submittedAt
          ? new Date(diagnosis.submittedAt)
          : new Date(),
        isRareCase: diagnosis.caseMetadata?.isRare || false,
        specialty: diagnosis.caseMetadata?.specialty,
        caseDifficulty: diagnosis.caseMetadata?.difficulty,
      },
      create: {
        id: diagnosis.id,
        conversationId: diagnosis.conversationId,
        userId: diagnosis.studentId,
        submittedDiagnosis: diagnosis.submittedDiagnosis,
        actualDiagnosis: diagnosis.actualDiagnosis,
        isCorrect: diagnosis.isCorrect,
        submittedAt: diagnosis.submittedAt
          ? new Date(diagnosis.submittedAt)
          : new Date(),
        isRareCase: diagnosis.caseMetadata?.isRare || false,
        specialty: diagnosis.caseMetadata?.specialty,
        caseDifficulty: diagnosis.caseMetadata?.difficulty,
      },
    });
    report.diagnosisMigrated += 1;
  }

  for (const soap of legacySoap) {
    if (!conversationIds.has(soap.conversationId)) {
      report.skippedOrphans += 1;
      continue;
    }
    await prisma.medprepSoapNote.upsert({
      where: {
        conversationId_userId: {
          conversationId: soap.conversationId,
          userId: soap.studentId,
        },
      },
      update: {
        subjective: soap.subjective || "",
        objective: soap.objective || "",
        assessment: soap.assessment || "",
        plan: soap.plan || "",
        aiSubjective: soap.aiGeneratedSOAP?.subjective,
        aiObjective: soap.aiGeneratedSOAP?.objective,
        aiAssessment: soap.aiGeneratedSOAP?.assessment,
        aiPlan: soap.aiGeneratedSOAP?.plan,
        grade: soap.grade,
        feedback: soap.feedback,
        submittedAt: soap.submittedAt ? new Date(soap.submittedAt) : null,
      },
      create: {
        id: soap.id,
        conversationId: soap.conversationId,
        userId: soap.studentId,
        subjective: soap.subjective || "",
        objective: soap.objective || "",
        assessment: soap.assessment || "",
        plan: soap.plan || "",
        aiSubjective: soap.aiGeneratedSOAP?.subjective,
        aiObjective: soap.aiGeneratedSOAP?.objective,
        aiAssessment: soap.aiGeneratedSOAP?.assessment,
        aiPlan: soap.aiGeneratedSOAP?.plan,
        grade: soap.grade,
        feedback: soap.feedback,
        submittedAt: soap.submittedAt ? new Date(soap.submittedAt) : null,
      },
    });
    report.soapMigrated += 1;
  }

  const reportPath = path.join(
    process.cwd(),
    "scripts",
    "medprep-migration-report.json"
  );
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log("MedPrep migration complete:", report);
}

main()
  .catch((error) => {
    console.error("MedPrep migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
