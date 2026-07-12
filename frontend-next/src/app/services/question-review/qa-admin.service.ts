const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function adminRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers as Record<string, string>),
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : `Request failed (${response.status})`
    );
  }
  return data as T;
}

export type QaIssueCard = {
  id: string;
  questionId: string;
  questionTitle: string | null;
  system: string | null;
  topic: string | null;
  category: string | null;
  severity: string;
  status: string;
  title: string;
  body: string;
  section: string;
  targetType: string;
  targetKey: string;
  reporters: string[];
  reporterCount: number;
  assignedTo: { id: string; name: string } | null;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
};

export const qaAdminService = {
  getDashboard() {
    return adminRequest<{
      cards: Record<string, number | null>;
      charts: Record<string, unknown>;
      insights: string[];
    }>("/question-review/admin/qa/dashboard");
  },

  listInbox(params: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    const query = qs.toString();
    return adminRequest<QaIssueCard[]>(
      `/question-review/admin/qa/inbox${query ? `?${query}` : ""}`
    );
  },

  getFilterOptions() {
    return adminRequest<{
      systems: string[];
      topics: string[];
      categories: string[];
      reviewers: string[];
    }>("/question-review/admin/qa/filter-options");
  },

  listAssignees() {
    return adminRequest<
      Array<{ id: string; name: string; email: string; roles: string[] }>
    >("/question-review/admin/qa/assignees");
  },

  getReviewerInsights() {
    return adminRequest<
      Array<{
        name: string;
        sessions: number;
        questionsReviewed: number;
        issuesSubmitted: number;
        approvalRate: number;
        topCategories: Array<{ name: string; count: number }>;
      }>
    >("/question-review/admin/qa/reviewer-insights");
  },

  getIssue(issueId: string) {
    return adminRequest(`/question-review/admin/qa/issues/${issueId}`);
  },

  updateIssue(issueId: string, body: Record<string, unknown>) {
    return adminRequest(`/question-review/admin/qa/issues/${issueId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  addComment(issueId: string, body: { body: string; isInternal?: boolean }) {
    return adminRequest(`/question-review/admin/qa/issues/${issueId}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getQuestionReview(questionId: string) {
    return adminRequest<{
      question: Record<string, unknown>;
      issues: Array<Record<string, unknown>>;
      reviewerBundles: Array<{
        attemptId: string;
        reviewerName: string;
        reviewerEmail?: string | null;
        completedAt?: string | null;
        overallComment?: string | null;
        approvalStatus?: string | null;
        questionQualityRating?: number | null;
        explanationQualityRating?: number | null;
        feedbackCount: number;
        annotations: Array<{
          id: string;
          targetType: string;
          targetKey: string;
          section: string;
          selectedText?: string | null;
          body: string;
          tags: string[];
          severity: string;
          createdAt: string;
        }>;
      }>;
      draftSnapshot?: Record<string, unknown>;
      qaRecord?: Record<string, unknown>;
    }>(`/question-review/admin/qa/questions/${questionId}`);
  },

  saveDraft(
    questionId: string,
    body: { draftSnapshot: Record<string, unknown>; summary?: string }
  ) {
    return adminRequest(
      `/question-review/admin/qa/questions/${questionId}/draft`,
      { method: "POST", body: JSON.stringify(body) }
    );
  },

  approveQuestion(
    questionId: string,
    body: {
      productionStatus: string;
      ratings?: Record<string, number>;
      decisionNote?: string;
    }
  ) {
    return adminRequest(
      `/question-review/admin/qa/questions/${questionId}/approval`,
      { method: "POST", body: JSON.stringify(body) }
    );
  },

  listBundles() {
    return adminRequest("/question-review/admin/bundles");
  },
};
