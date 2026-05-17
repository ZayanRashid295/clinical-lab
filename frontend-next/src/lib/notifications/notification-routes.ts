import type { AppNotification } from "@/app/services/launch";

/** Resolve in-app navigation target for a notification click. */
export function getNotificationRoute(n: AppNotification): string | null {
  const data: Record<string, unknown> = (n.data as Record<string, unknown>) ?? {};
  if (typeof data.route === "string" && data.route.startsWith("/")) {
    if (n.type === "FACULTY_MESSAGE" && typeof data.facultyUserId === "string") {
      return `/messages?facultyId=${encodeURIComponent(data.facultyUserId)}`;
    }
    return data.route;
  }

  switch (n.type) {
    case "FACULTY_MESSAGE":
      return typeof data.facultyUserId === "string"
        ? `/messages?facultyId=${encodeURIComponent(data.facultyUserId)}`
        : "/messages";
    case "ASSIGNMENT_PUBLISHED":
    case "ASSIGNMENT_DUE":
      return "/assignments";
    case "DISCUSSION_REPLY":
    case "DISCUSSION_UPVOTE":
    case "DISCUSSION_CREATED":
      return data.discussionId
        ? `/discussions/${data.discussionId}`
        : "/discussions";
    case "STUDY_GROUP_POST":
    case "STUDY_GROUP_JOIN":
      return data.groupId ? `/study-groups/${data.groupId}` : "/study-groups";
    case "FEEDBACK_REPLY":
    case "FEEDBACK_TICKET_CREATED":
    case "FEEDBACK_USER_REPLY":
      return data.ticketId ? `/feedback/${data.ticketId}` : "/feedback";
    case "QUESTION_REPORT_UPDATE":
    case "QUESTION_REPORT_CREATED":
      return "/my-reports";
    case "MOCK_EXAM_RESULT":
    case "MOCK_EXAM_PUBLISHED":
      return "/mock-exams";
    case "GOAL_COMPLETED":
    case "GOAL_PROGRESS":
    case "GOAL_DUE":
      return "/goals";
    case "ACHIEVEMENT_UNLOCKED":
    case "STREAK_MILESTONE":
    case "STREAK_RISK":
      return "/achievements";
    case "SUBSCRIPTION_EXPIRING":
    case "SUBSCRIPTION_EXPIRED":
    case "SUBSCRIPTION_RENEWED":
      return "/subscriptions";
    case "WELCOME":
      return typeof data.route === "string" ? data.route : "/study";
    default:
      return null;
  }
}

export function isFacultyNotificationType(type: string): boolean {
  return (
    type === "FACULTY_MESSAGE" ||
    type === "ASSIGNMENT_PUBLISHED" ||
    type === "ASSIGNMENT_DUE"
  );
}
