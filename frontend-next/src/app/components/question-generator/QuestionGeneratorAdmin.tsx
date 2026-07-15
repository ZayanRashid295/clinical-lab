"use client";

import { useRouter } from "next/router";
import AdminDashboard from "./admin-dashboard";

export default function QuestionGeneratorAdmin() {
  const router = useRouter();

  const questionIdFromQuery =
    router.isReady && typeof router.query.questionId === "string"
      ? router.query.questionId.trim() || null
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background dark:bg-gray-900">
      <div className="min-h-0 flex-1 overflow-hidden">
        <AdminDashboard initialQuestionId={questionIdFromQuery} />
      </div>
    </div>
  );
}
