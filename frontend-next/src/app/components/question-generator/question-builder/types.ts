export interface ValidationIssue {
  code: string;
  section: string;
  severity: "error" | "warning";
  message: string;
  fix: string;
}

export interface ValidationResult {
  valid: boolean;
  questionId?: string;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: string;
}

export interface ConvertFileResult {
  sourceName: string;
  questionId?: string;
  success: boolean;
  error?: string;
  validation?: ValidationResult;
}

export interface ConvertResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: ConvertFileResult[];
}

export interface Explanation {
  title: string;
  body: string;
  bodyHtml?: string;
  clinicalReasoning?: string;
  clinicalReasoningHtml?: string;
  systemInvolved?: string;
  systemInvolvedHtml?: string;
}

export interface FeatureRow {
  feature: string;
  featureHtml?: string;
  description: string;
  descriptionHtml?: string;
  clinicalImportance: string;
  clinicalImportanceHtml?: string;
}

export interface DifferentialRow {
  condition: string;
  conditionHtml?: string;
  distinguishingFeatures: string;
  distinguishingFeaturesHtml?: string;
  keyDifferences: string;
  keyDifferencesHtml?: string;
}

export interface ImageRef {
  filename: string;
  path: string;
  sourceName: string;
}

export interface Diagram {
  name?: string;
  caption?: string;
  captionHtml?: string;
  image?: string;
  images?: ImageRef[];
}

export interface QuestionMetadata {
  category?: string;
  product?: string;
  system?: string;
  topic?: string;
  subtopic?: string;
  mcqTitle?: string;
  competencyDomain?: string;
  cognitiveLevel?: string;
  clinicalSkill?: string;
  difficultyLevel?: string;
  domain?: string;
}

export interface QuestionData {
  questionId: string;
  questionNumber: string;
  stem: string;
  stemHtml?: string;
  options: string[];
  optionsHtml?: string[];
  correctAnswer: string;
  keywords: string[];
  keywordsHtml?: string[];
  explanations: Record<string, Explanation>;
  keyConcept: string;
  keyConceptHtml?: string;
  metadata: QuestionMetadata;
  classicTriad?: string;
  classicTriadHtml?: string;
  featureTableName?: string;
  featureTable?: FeatureRow[];
  differentialDiagnosisTableName?: string;
  differentialDiagnosisTable?: DifferentialRow[];
  diagram?: Diagram;
}
