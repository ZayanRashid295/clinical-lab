export const ISSUE_TAGS = [
  "Grammar",
  "Typo",
  "Medical Accuracy",
  "Guideline Issue",
  "Ambiguous Wording",
  "Incorrect Explanation",
  "Weak Distractor",
  "Image Issue",
  "Formatting",
  "Table Issue",
  "Difficulty",
  "Suggestion",
  "Other",
] as const;

export type IssueTag = (typeof ISSUE_TAGS)[number];

export type ReviewAnnotationTarget =
  | "STEM"
  | "OPTION"
  | "EXPLANATION"
  | "KEYWORD"
  | "TABLE"
  | "TABLE_CELL"
  | "TABLE_ROW"
  | "IMAGE"
  | "METADATA"
  | "OVERALL";

export type ReviewSeverity = "MINOR" | "MAJOR" | "CRITICAL";

export type ReviewDifficulty = "TOO_EASY" | "APPROPRIATE" | "TOO_DIFFICULT";

export type ReviewApproval = "APPROVE" | "NEEDS_REVISION" | "REJECT";

export type ReviewProgress = {
  stemReviewed: boolean;
  explanationReviewed: boolean;
  imagesReviewed: boolean;
  metadataReviewed: boolean;
  overallReviewed: boolean;
};

export type ReviewAnnotation = {
  id: string;
  targetType: ReviewAnnotationTarget;
  targetKey: string;
  section: string;
  selectedText?: string | null;
  anchorMeta?: Record<string, unknown> | null;
  body: string;
  tags: string[];
  severity: ReviewSeverity;
  createdAt?: string;
};

export type ReviewTarget = {
  targetType: ReviewAnnotationTarget;
  targetKey: string;
  section: string;
  selectedText?: string;
  anchorMeta?: Record<string, unknown>;
  preview?: string;
  /** Viewport Y — positions the feedback panel beside the selection */
  anchorY?: number;
  /** When set, drawer opens in read-only view for this saved annotation */
  highlightAnnotationId?: string;
  viewOnly?: boolean;
};

export type OverallReviewState = {
  questionQualityRating: number;
  explanationQualityRating: number;
  imageQualityRating: number;
  difficultyRating: ReviewDifficulty;
  approvalStatus: ReviewApproval;
  overallComment: string;
};

export const DEFAULT_REVIEW_PROGRESS: ReviewProgress = {
  stemReviewed: false,
  explanationReviewed: false,
  imagesReviewed: false,
  metadataReviewed: false,
  overallReviewed: false,
};

export const DEFAULT_OVERALL_REVIEW: OverallReviewState = {
  questionQualityRating: 0,
  explanationQualityRating: 0,
  imageQualityRating: 0,
  difficultyRating: "APPROPRIATE",
  approvalStatus: "NEEDS_REVISION",
  overallComment: "",
};

function annotationBelongsToTarget(annotationKey: string, targetKey: string) {
  if (annotationKey === targetKey) return true;
  const selIdx = annotationKey.indexOf(":sel-");
  const block = selIdx === -1 ? annotationKey : annotationKey.slice(0, selIdx);
  if (block === targetKey) return true;
  return (
    annotationKey.startsWith(`${targetKey}:`) &&
    annotationKey.charAt(targetKey.length) === ":"
  );
}

export function countAnnotationsForTarget(
  annotations: ReviewAnnotation[],
  targetKey: string
) {
  return annotations.filter((a) =>
    annotationBelongsToTarget(a.targetKey, targetKey)
  ).length;
}

export function sectionFromTargetType(
  targetType: ReviewAnnotationTarget
): keyof ReviewProgress | null {
  switch (targetType) {
    case "STEM":
      return "stemReviewed";
    case "EXPLANATION":
    case "KEYWORD":
    case "TABLE":
    case "TABLE_CELL":
    case "TABLE_ROW":
      return "explanationReviewed";
    case "IMAGE":
      return "imagesReviewed";
    case "METADATA":
      return "metadataReviewed";
    default:
      return null;
  }
}
