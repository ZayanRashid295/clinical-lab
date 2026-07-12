"use client";

import { useEffect, useState } from "react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { questionReviewService } from "@/app/services/question-review/question-review.service";
import { ExternalLink, MessageSquareText } from "lucide-react";

export default function QuestionReviewAdminPage() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [b, a] = await Promise.all([
          questionReviewService.listBundlesAdmin(),
          questionReviewService.listAttemptsAdmin(),
        ]);
        if (!cancelled) {
          setBundles(b);
          setAttempts(a);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAttemptDetail = async (attemptId: string) => {
    try {
      const detail = await questionReviewService.getAttemptAdmin(attemptId);
      setSelectedAttempt(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load attempt");
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading review data…</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquareText className="h-7 w-7" />
          MCQ Quality Review
        </h1>
        <p className="text-muted-foreground mt-1">
          Shareable review URLs for doctor / student testers. Each link opens a
          fixed question set with mandatory per-question comments.
        </p>
      </div>

      {error && (
        <Card className="p-4 border-destructive/50 text-destructive text-sm">
          {error}
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Review URLs (share with testers)</h2>
        <div className="space-y-2">
          {bundles.map((b) => (
            <div
              key={b.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/40"
            >
              <div>
                <p className="font-medium">{b.title}</p>
                <p className="text-xs text-muted-foreground">
                  {b.questionCount} questions · {b.attemptCount} sessions started
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded border">
                  /qa-review/{b.slug}
                </code>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${origin}/qa-review/${b.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Open
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          After deploy: run{" "}
          <code className="bg-muted px-1 rounded">npm run prisma:seed:question-review</code>{" "}
          on the server to populate bundles from your 107 questions.
        </p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Submitted sessions</h2>
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {attempts.length === 0 && (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            )}
            {attempts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => loadAttemptDetail(a.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                  selectedAttempt?.id === a.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <p className="font-medium text-sm">{a.reviewerName}</p>
                <p className="text-xs text-muted-foreground">
                  {a.bundle?.title} · {a.status} ·{" "}
                  {new Date(a.startedAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-3">Session detail</h2>
          {!selectedAttempt ? (
            <p className="text-sm text-muted-foreground">
              Select a session to read per-question comments.
            </p>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              <p className="text-sm">
                <strong>{selectedAttempt.reviewerName}</strong>
                {selectedAttempt.reviewerEmail && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {selectedAttempt.reviewerEmail}
                  </span>
                )}
              </p>
              {selectedAttempt.responses?.map((r: any, i: number) => (
                <div key={r.id} className="p-3 rounded-lg border text-sm space-y-1">
                  <p className="font-medium">
                    Q{i + 1} · {r.question?.system?.name}
                    {r.question?.topic?.name ? ` / ${r.question.topic.name}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {r.question?.question}
                  </p>
                  <p>
                    Answer: <strong>{r.userAnswer ?? "—"}</strong>
                    {r.isCorrect != null && (
                      <span
                        className={
                          r.isCorrect ? " text-emerald-600" : " text-red-600"
                        }
                      >
                        {" "}
                        ({r.isCorrect ? "correct" : "incorrect"})
                      </span>
                    )}
                  </p>
                  <p className="text-foreground/90 whitespace-pre-wrap bg-muted/30 p-2 rounded">
                    {r.qualityComment?.trim() || (
                      <span className="text-muted-foreground italic">No comment</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
