export type BulkQuestionMetadata = {
  categoryId?: string;
  productId?: string;
  systemId?: string;
  topicId?: string;
  subtopicId?: string;
  title?: string;
};

export type MetadataFieldKey =
  | "category"
  | "product"
  | "system"
  | "topic"
  | "subtopic"
  | "mcqTitle";

export const METADATA_FIELD_LABELS: Record<MetadataFieldKey, string> = {
  category: "Category",
  product: "Product",
  system: "System",
  topic: "Topic",
  subtopic: "Subtopic",
  mcqTitle: "MCQ Title",
};

export function getMissingMetadataFields(
  metadata: BulkQuestionMetadata | undefined,
  parsedTitle?: string
): MetadataFieldKey[] {
  const m = metadata || {};
  const missing: MetadataFieldKey[] = [];

  if (!m.categoryId?.trim()) missing.push("category");
  if (!m.productId?.trim()) missing.push("product");
  if (!m.systemId?.trim()) missing.push("system");
  if (!m.topicId?.trim()) missing.push("topic");
  if (!m.subtopicId?.trim()) missing.push("subtopic");

  const title = (m.title || parsedTitle || "").trim();
  if (!title) missing.push("mcqTitle");

  return missing;
}

export interface QuestionMetadataValidationIssue {
  fileName: string;
  missing: MetadataFieldKey[];
  missingLabels: string[];
}

export interface BulkMetadataValidationReport {
  isComplete: boolean;
  issues: QuestionMetadataValidationIssue[];
}

export function buildBulkMetadataValidationReport(
  results: Array<{ fileName: string; status: string; questionData?: { title?: string } }>,
  questionMetadata: Record<string, BulkQuestionMetadata | undefined>
): BulkMetadataValidationReport {
  const issues: QuestionMetadataValidationIssue[] = [];

  for (const result of results) {
    if (result.status !== "success" || !result.questionData) continue;

    const missing = getMissingMetadataFields(
      questionMetadata[result.fileName],
      result.questionData.title
    );

    if (missing.length > 0) {
      issues.push({
        fileName: result.fileName,
        missing,
        missingLabels: missing.map((key) => METADATA_FIELD_LABELS[key]),
      });
    }
  }

  return { isComplete: issues.length === 0, issues };
}

export function formatBulkMetadataValidationErrors(
  report: BulkMetadataValidationReport
): string[] {
  return report.issues.map(
    (issue) =>
      `${issue.fileName}: missing ${issue.missingLabels.join(", ")}`
  );
}
