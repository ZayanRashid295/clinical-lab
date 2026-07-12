const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function reviewRequest(
  endpoint: string,
  options: RequestInit = {},
  attemptSecret?: string
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (attemptSecret) {
    headers["X-Review-Attempt-Secret"] = attemptSecret;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid response from server (${response.status})`);
    }
  }

  if (!response.ok) {
    const payload = data as { message?: string | string[] } | null;
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : Array.isArray(payload?.message)
          ? payload.message.join(". ")
          : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export type ReviewBundleMeta = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  questionCount: number;
};

export type ReviewAnnotation = {
  id: string;
  targetType: string;
  targetKey: string;
  section: string;
  selectedText?: string | null;
  anchorMeta?: Record<string, unknown> | null;
  body: string;
  tags: string[];
  severity: string;
  createdAt?: string;
};

export type ReviewProgress = {
  stemReviewed: boolean;
  explanationReviewed: boolean;
  imagesReviewed: boolean;
  metadataReviewed: boolean;
  overallReviewed: boolean;
};

export type ReviewQuestionResponse = {
  id?: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  qualityComment: string | null;
  overallComment: string | null;
  timeSpent: number | null;
  questionQualityRating: number | null;
  explanationQualityRating: number | null;
  imageQualityRating: number | null;
  difficultyRating: string | null;
  approvalStatus: string | null;
  reviewProgress: ReviewProgress | null;
  reviewModeEnteredAt: string | null;
  annotations: ReviewAnnotation[];
};

export type ReviewQuestion = {
  order: number;
  id: string;
  stem: string;
  title: string | null;
  system: string | null;
  topic: string | null;
  questionStemBlocks: unknown[];
  options: Array<{ label: string; text: string; correct: boolean; value?: string }>;
  explanation: unknown[];
  perAnswerExplanations: Record<string, string | unknown[]>;
  response?: ReviewQuestionResponse;
};

export const questionReviewService = {
  getBundle(slug: string): Promise<ReviewBundleMeta> {
    return reviewRequest(`/question-review/bundles/${slug}`);
  },

  startAttempt(slug: string, body: { reviewerName: string; reviewerEmail?: string }) {
    return reviewRequest(`/question-review/bundles/${slug}/start`, {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<{
      attemptId: string;
      attemptSecret: string;
      bundle: { slug: string; title: string; description: string | null };
      questions: ReviewQuestion[];
    }>;
  },

  getAttempt(attemptId: string, attemptSecret: string) {
    return reviewRequest(
      `/question-review/attempts/${attemptId}`,
      { method: "GET" },
      attemptSecret
    ) as Promise<{
      attemptId: string;
      status: string;
      reviewerName: string;
      questions: ReviewQuestion[];
    }>;
  },

  updateResponse(
    attemptId: string,
    questionId: string,
    attemptSecret: string,
    body: Record<string, unknown>
  ) {
    return reviewRequest(
      `/question-review/attempts/${attemptId}/responses/${questionId}`,
      { method: "PATCH", body: JSON.stringify(body) },
      attemptSecret
    ) as Promise<ReviewQuestionResponse>;
  },

  createAnnotation(
    attemptId: string,
    questionId: string,
    attemptSecret: string,
    body: Record<string, unknown>
  ) {
    return reviewRequest(
      `/question-review/attempts/${attemptId}/responses/${questionId}/annotations`,
      { method: "POST", body: JSON.stringify(body) },
      attemptSecret
    ) as Promise<ReviewAnnotation>;
  },

  completeAttempt(attemptId: string, attemptSecret: string) {
    return reviewRequest(
      `/question-review/attempts/${attemptId}/complete`,
      { method: "POST" },
      attemptSecret
    );
  },

  listBundlesAdmin() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    return fetch(`${API_BASE_URL}/question-review/admin/bundles`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Failed to load bundles");
      return data;
    });
  },

  listAttemptsAdmin(bundleId?: string) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const qs = bundleId ? `?bundleId=${bundleId}` : "";
    return fetch(`${API_BASE_URL}/question-review/admin/attempts${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Failed to load attempts");
      return data;
    });
  },

  getAttemptAdmin(attemptId: string) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    return fetch(`${API_BASE_URL}/question-review/admin/attempts/${attemptId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Failed to load attempt");
      return data;
    });
  },
};

export function getReviewSessionKey(slug: string) {
  return `qa-review-session:${slug}`;
}

export function loadReviewSession(slug: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getReviewSessionKey(slug));
    return raw
      ? (JSON.parse(raw) as {
          attemptId: string;
          attemptSecret: string;
          reviewerName: string;
        })
      : null;
  } catch {
    return null;
  }
}

export function saveReviewSession(
  slug: string,
  data: { attemptId: string; attemptSecret: string; reviewerName: string }
) {
  localStorage.setItem(getReviewSessionKey(slug), JSON.stringify(data));
}

export function clearReviewSession(slug: string) {
  localStorage.removeItem(getReviewSessionKey(slug));
}
