export interface ActivityLogUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface ActivityLog {
  id: string;
  time: string;
  createdAt: string;
  userId: string | null;
  userFullName: string | null;
  userEmail: string | null;
  affectedUserId: string | null;
  affectedUserFullName: string | null;
  affectedUserEmail: string | null;
  contextType: string | null;
  contextId: string | null;
  contextLabel: string | null;
  component: string;
  componentLabel: string;
  eventName: string;
  eventLabel: string;
  ipAddress: string | null;
  ipAddressRaw?: string | null;
  ipForwardedFor?: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ActivityLogDetailField {
  label: string;
  value: string | number | boolean | null;
}

export interface ActivityLogTestHistoryQuestion {
  order: number;
  questionId: string;
  title: string | null;
  system: string | null;
  topic: string | null;
  stem?: string;
  stemPreview?: string;
  userAnswer: string | null;
  userAnswerLabel?: string | null;
  userAnswerText?: string | null;
  userAnswerDisplay?: string | null;
  correctAnswer: string | null;
  correctAnswerLabel?: string | null;
  correctAnswerText?: string | null;
  correctAnswerDisplay?: string | null;
  isCorrect: boolean | null;
  markedForReview: boolean;
  timeSpentSeconds: number | null;
  options?: Array<{ label: string; text: string; isCorrect: boolean }>;
}

export interface ActivityLogDetailSection {
  id: string;
  title: string;
  fields?: ActivityLogDetailField[];
  testHistory?: {
    questionPaper: Record<string, unknown>;
    student: Record<string, unknown> | null;
    summary: Record<string, unknown>;
    questions: ActivityLogTestHistoryQuestion[];
  };
  items?: Array<Record<string, unknown>>;
}

export interface ActivityLogFullDetails {
  logId: string;
  detailType: string;
  title: string;
  sections: ActivityLogDetailSection[];
}

export interface ActivityLogQueryParams {
  search?: string;
  userId?: string;
  affectedUserId?: string;
  component?: string;
  eventName?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "component" | "eventName";
  sortOrder?: "asc" | "desc";
}

export interface ActivityLogFilters extends ActivityLogQueryParams {}

export interface ActivityLogStats {
  total: number;
  today: number;
  uniqueUsersToday: number;
  topComponents: Array<{
    component: string;
    label: string;
    count: number;
  }>;
}

export interface ActivityLogFilterOptions {
  components: Array<{ value: string; label: string }>;
  events: Array<{ value: string; label: string }>;
}
