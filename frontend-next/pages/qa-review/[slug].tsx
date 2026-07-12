import { useRouter } from "next/router";
import QaReviewPage from "@/app/components/QuestionReview/QaReviewPage";

/** Public shareable MCQ quality review — no login required. */
export default function QaReviewRoutePage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";

  if (!router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid review link</p>
      </div>
    );
  }

  return <QaReviewPage slug={slug} />;
}
