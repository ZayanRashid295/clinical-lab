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

export interface TableRow {
  cells: string[];
  cellsHtml?: string[];
}

export interface ParsedTable {
  heading: string;
  headingHtml?: string;
  columns: string[];
  columnsHtml?: string[];
  rows: TableRow[];
}

export interface ImageRef {
  filename: string;
  path: string;
  sourceName: string;
}

export interface Diagram {
  heading?: string;
  headingHtml?: string;
  description?: string;
  descriptionHtml?: string;
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
  keyConceptTitle?: string;
  metadata: QuestionMetadata;
  classicTriad?: string;
  classicTriadHtml?: string;
  classicTriadTitle?: string;
  tables?: ParsedTable[];
  diagrams?: Diagram[];
  /** @deprecated Use tables[0] */
  table1?: ParsedTable;
  /** @deprecated Use tables[1] */
  table2?: ParsedTable;
  /** @deprecated Use diagrams[0] */
  diagram?: Diagram;
}
