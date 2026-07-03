export const ACTIVITY_COMPONENTS = {
  AUTH: "auth",
  ASSESSMENT: "assessment",
  QBANK: "qbank",
  SUBSCRIPTION: "subscription",
  PAYMENT: "payment",
  USER: "user",
  ROLE: "role",
  CONTENT: "content",
  MEDPREP: "medprep",
  MOCK_EXAM: "mock_exam",
  QUESTION_REPORT: "question_report",
  ADMIN: "admin",
} as const;

export type ActivityComponent =
  (typeof ACTIVITY_COMPONENTS)[keyof typeof ACTIVITY_COMPONENTS];

export const ACTIVITY_EVENTS = {
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",
  USER_REGISTERED: "user_registered",
  PROFILE_UPDATED: "profile_updated",

  QUIZ_CREATED: "quiz_created",
  QUIZ_STARTED: "quiz_started",
  QUIZ_SUBMITTED: "quiz_submitted",
  QUIZ_VIEWED: "quiz_viewed",

  QUESTION_CREATED: "question_created",
  QUESTION_UPDATED: "question_updated",
  QUESTION_DELETED: "question_deleted",
  QUESTION_IMPORTED: "question_imported",

  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_UPDATED: "subscription_updated",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",

  PAYMENT_PROCESSED: "payment_processed",
  PAYMENT_FAILED: "payment_failed",

  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DEACTIVATED: "user_deactivated",

  ROLE_CREATED: "role_created",
  ROLE_UPDATED: "role_updated",
  ROLE_ASSIGNED: "role_assigned",
  ROLE_REMOVED: "role_removed",

  TOPIC_CREATED: "topic_created",
  SUBTOPIC_CREATED: "subtopic_created",

  MOCK_EXAM_COMPLETED: "mock_exam_completed",
  QUESTION_REPORT_CREATED: "question_report_created",
} as const;

export type ActivityEventName =
  (typeof ACTIVITY_EVENTS)[keyof typeof ACTIVITY_EVENTS];

export const ACTIVITY_COMPONENT_LABELS: Record<string, string> = {
  auth: "Authentication",
  assessment: "Assessment",
  qbank: "Question Bank",
  subscription: "Subscription",
  payment: "Payment",
  user: "User Management",
  role: "Role Management",
  content: "Content",
  medprep: "MedPrep AI",
  mock_exam: "Mock Exam",
  question_report: "Question Report",
  admin: "Administration",
};

export const ACTIVITY_EVENT_LABELS: Record<string, string> = {
  user_logged_in: "User logged in",
  user_logged_out: "User logged out",
  user_registered: "User registered",
  profile_updated: "Profile updated",
  quiz_created: "Quiz created",
  quiz_started: "Quiz started",
  quiz_submitted: "Quiz submitted",
  quiz_viewed: "Quiz results viewed",
  question_created: "Question created",
  question_updated: "Question updated",
  question_deleted: "Question deleted",
  question_imported: "Questions imported",
  subscription_created: "Subscription created",
  subscription_updated: "Subscription updated",
  subscription_cancelled: "Subscription cancelled",
  payment_processed: "Payment processed",
  payment_failed: "Payment failed",
  user_created: "User created",
  user_updated: "User updated",
  user_deactivated: "User deactivated",
  role_created: "Role created",
  role_updated: "Role updated",
  role_assigned: "Role assigned",
  role_removed: "Role removed",
  topic_created: "Topic created",
  subtopic_created: "Subtopic created",
  mock_exam_completed: "Mock exam completed",
  question_report_created: "Question report submitted",
};
