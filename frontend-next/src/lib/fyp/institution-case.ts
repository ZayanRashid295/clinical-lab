import type { MedicalCase } from "./data-models";
import { sampleCases } from "./data-models";
import {
  caseSnapshotFromSession,
  fetchResumeSession,
  type MedprepMode,
} from "./medprep-persistence-service";
import { studentInstitutionApiService } from "@/app/services/faculty/student-institution-api.service";

export type InstitutionCaseRecord = {
  id: string;
  title: string;
  specialty?: string | null;
  difficulty?: string | null;
  disease: string;
  diseaseName?: string | null;
  symptoms?: unknown;
  history?: unknown;
  labs?: unknown;
  patientProfile?: unknown;
  learningObjectives?: string | null;
  mode?: string;
};

export function institutionCaseToMedicalCase(
  row: InstitutionCaseRecord,
): MedicalCase {
  const diffRaw = String(row.difficulty ?? "medium").toLowerCase();
  const difficulty =
    diffRaw === "beginner" || diffRaw === "advanced"
      ? diffRaw
      : "intermediate";
  const profile =
    row.patientProfile && typeof row.patientProfile === "object"
      ? (row.patientProfile as Record<string, unknown>)
      : {};
  const symptoms = Array.isArray(row.symptoms)
    ? row.symptoms.map(String)
    : [];
  const history = Array.isArray(row.history) ? row.history.map(String) : [];
  const labs =
    row.labs && typeof row.labs === "object"
      ? (row.labs as Record<string, unknown>)
      : {};

  return {
    id: row.id,
    title: row.title,
    description:
      row.learningObjectives?.trim() ||
      `Institution case — ${row.disease}`,
    difficulty,
    disease: row.disease,
    diseaseName: row.diseaseName ?? row.disease,
    specialty: row.specialty ?? "General Medicine",
    isRare: false,
    symptoms,
    history,
    labs,
    expectedQuestions: [],
    patientProfile: {
      name: String(profile.name ?? "Patient"),
      age: Number(profile.age ?? 40),
      gender: String(profile.gender ?? "Unknown"),
      occupation: String(profile.occupation ?? "Unknown"),
    },
    createdAt: new Date().toISOString(),
  };
}

export function casePurposeToMedprepMode(
  purpose: "practice" | "learning" | "evaluation" | "shadow",
): MedprepMode {
  if (purpose === "learning") return "LEARNING";
  if (purpose === "evaluation") return "EVALUATION";
  if (purpose === "shadow") return "SHADOW";
  return "PRACTICE";
}

export async function fetchInstitutionCase(
  caseId: string,
): Promise<MedicalCase | null> {
  try {
    const row = (await studentInstitutionApiService.getCase(
      caseId,
    )) as InstitutionCaseRecord;
    return institutionCaseToMedicalCase(row);
  } catch {
    return null;
  }
}

/** Resolve a case from library, DB snapshot, or institution API. */
export async function resolveMedicalCase(
  caseId: string,
  opts?: { userId?: string; mode?: MedprepMode },
): Promise<MedicalCase | null> {
  const fromLibrary = sampleCases.find((c) => c.id === caseId);
  if (fromLibrary) return fromLibrary;

  if (opts?.userId && opts.userId !== "anonymous") {
    const dbSession = await fetchResumeSession(
      opts.userId,
      opts.mode ?? "PRACTICE",
      caseId,
    );
    const snap = dbSession ? caseSnapshotFromSession(dbSession) : null;
    if (snap) return snap;
  }

  return fetchInstitutionCase(caseId);
}

export function assignmentStartMetadata(input: {
  assignmentId?: string;
  institutionCaseId: string;
}): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    institutionCaseId: input.institutionCaseId,
  };
  if (input.assignmentId) meta.assignmentId = input.assignmentId;
  return meta;
}

export function medprepRouteForAssignmentItem(
  mode: string | null | undefined,
  caseId: string,
  assignmentId: string,
): string {
  const q = new URLSearchParams({ assignmentId });
  switch (mode) {
    case "LEARNING":
      return `/medprep-ai/learning-nurse-report?caseId=${encodeURIComponent(caseId)}&${q}`;
    case "EVALUATION":
      return `/medprep-ai/evaluation-nurse-report?caseId=${encodeURIComponent(caseId)}&${q}`;
    case "SHADOW":
      return `/medprep-ai/shadow-cases?${q}&highlightCase=${encodeURIComponent(caseId)}`;
    default:
      return `/medprep-ai/practice-nurse-report?caseId=${encodeURIComponent(caseId)}&${q}`;
  }
}
