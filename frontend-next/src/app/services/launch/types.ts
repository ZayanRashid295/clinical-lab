// Shared TypeScript types for the launch modules.
// Mirrors the backend Prisma models.

// ─── Notifications ──────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  isSent: boolean;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt: string;
}

// ─── Achievements ───────────────────────────────────────────────────────────
export type AchievementMetric =
  | "QUESTIONS_ANSWERED"
  | "CORRECT_ANSWERS"
  | "TESTS_COMPLETED"
  | "FLASHCARDS_REVIEWED"
  | "NOTES_CREATED"
  | "STREAK_DAYS"
  | "STUDY_MINUTES"
  | "DISCUSSION_POSTS"
  | "GOAL_COMPLETED";

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  threshold: number;
  metric: AchievementMetric;
  isActive: boolean;
}

export interface AchievementWithProgress extends Achievement {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export interface AchievementsOverview {
  points: { total: number; level: number; nextLevelAt: number };
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | null;
  };
  counts: { unlocked: number; total: number };
  items: AchievementWithProgress[];
  recent: Array<{
    id: string;
    unlockedAt: string;
    achievement: Achievement | null;
  }>;
}

export interface LeaderboardEntry {
  userId: string;
  total: number;
  level: number;
  user?: UserLite;
}

// ─── Shared user shape (for display) ─────────────────────────────────────────
export interface UserLite {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  avatar?: string | null;
}

// ─── Discussions ────────────────────────────────────────────────────────────
export type DiscussionContext =
  | "GENERAL"
  | "QUESTION"
  | "TOPIC"
  | "SYSTEM"
  | "PRODUCT";

export interface Discussion {
  id: string;
  authorId: string;
  author?: UserLite;
  title: string;
  body: string;
  context: DiscussionContext;
  questionId?: string | null;
  topicId?: string | null;
  systemId?: string | null;
  productId?: string | null;
  pinned: boolean;
  isClosed: boolean;
  upvotes: number;
  replyCount: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionReply {
  id: string;
  discussionId: string;
  authorId: string;
  author?: UserLite;
  body: string;
  upvotes: number;
  isAnswer: boolean;
  createdAt: string;
}

export interface DiscussionWithReplies extends Discussion {
  replies: DiscussionReply[];
}

// ─── AI Tutor ───────────────────────────────────────────────────────────────
export type AiTutorRole = "USER" | "ASSISTANT" | "SYSTEM";
export type AiTutorContext =
  | "GENERAL"
  | "QUESTION"
  | "TOPIC"
  | "SYSTEM"
  | "PRODUCT"
  | "STUDY_PLAN";

export interface AiTutorConversation {
  id: string;
  userId: string;
  title: string;
  context: AiTutorContext;
  contextId?: string | null;
  pinned: boolean;
  archivedAt?: string | null;
  lastMessageAt: string;
  createdAt: string;
}

export interface AiTutorMessage {
  id: string;
  conversationId: string;
  role: AiTutorRole;
  content: string;
  model?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  createdAt: string;
}

export interface AiTutorConversationDetail extends AiTutorConversation {
  messages: AiTutorMessage[];
}

// ─── Mock Exams ─────────────────────────────────────────────────────────────
export interface MockExam {
  id: string;
  title: string;
  description?: string | null;
  totalQuestions: number;
  durationMinutes: number;
  difficulty: string;
  productId?: string | null;
  systemIds?: string[] | null;
  topicIds?: string[] | null;
  isPublished: boolean;
  createdAt: string;
}

export type MockExamAttemptStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export interface MockExamAttempt {
  id: string;
  mockExamId: string;
  userId: string;
  questionPaperId?: string | null;
  status: MockExamAttemptStatus;
  startedAt: string;
  completedAt?: string | null;
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  timeSpentSeconds: number;
  mockExam?: MockExam;
}

// ─── Study Groups ───────────────────────────────────────────────────────────
export interface StudyGroup {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  icon: string;
  color: string;
  isPrivate: boolean;
  inviteCode?: string | null;
  ownerId: string;
  owner?: UserLite;
  memberCount: number;
  createdAt: string;
}

export interface StudyGroupMember {
  id: string;
  groupId: string;
  userId: string;
  user?: UserLite;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
}

export interface StudyGroupPost {
  id: string;
  groupId: string;
  authorId: string;
  author?: UserLite;
  body: string;
  attachmentUrl?: string | null;
  pinned: boolean;
  createdAt: string;
}

export interface StudyGroupDetail extends StudyGroup {
  members: StudyGroupMember[];
  posts: StudyGroupPost[];
}

// ─── Goals ──────────────────────────────────────────────────────────────────
export type GoalMetric =
  | "QUESTIONS_ANSWERED"
  | "CORRECT_ANSWERS"
  | "STUDY_MINUTES"
  | "FLASHCARDS_REVIEWED"
  | "NOTES_CREATED"
  | "TESTS_COMPLETED";

export type GoalPeriod = "DAILY" | "WEEKLY" | "MONTHLY";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  createdAt: string;
}

export interface GoalWithProgress extends Goal {
  currentBucket: string;
  currentValue: number;
  achievedThisBucket: boolean;
}

export interface GoalProgressEntry {
  id: string;
  goalId: string;
  userId: string;
  bucket: string;
  value: number;
  achieved: boolean;
  achievedAt?: string | null;
}

export interface GoalDetail extends Goal {
  history: GoalProgressEntry[];
}

// ─── Feedback ───────────────────────────────────────────────────────────────
export type FeedbackCategory =
  | "GENERAL"
  | "BUG"
  | "FEATURE_REQUEST"
  | "CONTENT"
  | "BILLING"
  | "ACCOUNT";

export type FeedbackPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type FeedbackStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_USER"
  | "RESOLVED"
  | "CLOSED";

export interface FeedbackTicket {
  id: string;
  userId: string;
  user?: UserLite;
  subject: string;
  body: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  attachmentUrl?: string | null;
  assigneeId?: string | null;
  assignee?: UserLite | null;
  closedAt?: string | null;
  lastReplyAt: string;
  createdAt: string;
}

export interface FeedbackReply {
  id: string;
  ticketId: string;
  authorId: string;
  author?: UserLite;
  isStaff: boolean;
  body: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface FeedbackTicketDetail extends FeedbackTicket {
  replies: FeedbackReply[];
}

// ─── Question Reports ───────────────────────────────────────────────────────
export type QuestionReportReason =
  | "INCORRECT_ANSWER"
  | "TYPO"
  | "UNCLEAR"
  | "OUTDATED"
  | "DUPLICATE"
  | "OFFENSIVE"
  | "OTHER";

export type QuestionReportStatus =
  | "OPEN"
  | "TRIAGED"
  | "ACCEPTED"
  | "REJECTED"
  | "RESOLVED";

export interface QuestionReport {
  id: string;
  questionId: string;
  reporterId: string;
  reporter?: UserLite;
  reason: QuestionReportReason;
  details?: string | null;
  status: QuestionReportStatus;
  resolverId?: string | null;
  resolver?: UserLite | null;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}
