"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/shared/utils/cn";
import { ClipboardCheck, Inbox, Link2 } from "lucide-react";
import { QAInbox } from "./QAInbox";
import { QuestionReviewLayout } from "./QuestionReviewLayout";
import { useEffect, useState } from "react";
import { Card } from "@/shared/ui/card";
import { qaAdminService } from "@/app/services/question-review/qa-admin.service";
import { ExternalLink } from "lucide-react";

const NAV = [
  { href: "/admin/content/question-review", label: "Inbox", icon: Inbox },
  {
    href: "/admin/content/question-review/links",
    label: "UAT Links",
    icon: Link2,
  },
];

function UatLinksPanel() {
  const [bundles, setBundles] = useState<any[]>([]);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    qaAdminService.listBundles().then(setBundles).catch(() => {});
  }, []);

  return (
    <Card className="p-4 space-y-3">
      <h2 className="font-semibold flex items-center gap-2 dark:text-slate-100">
        <ClipboardCheck className="h-5 w-5" />
        Share with reviewers
      </h2>
      <p className="text-sm text-muted-foreground">
        Copy these links for students and doctors. Feedback appears in your Inbox.
      </p>
      <div className="space-y-2">
        {bundles.map((b) => (
          <div
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
          >
            <div>
              <p className="font-medium text-sm dark:text-slate-100">{b.title}</p>
              <p className="text-xs text-muted-foreground">
                {b.questionCount} questions · {b.attemptCount} sessions
              </p>
            </div>
            <a
              href={`${origin}/qa-review/${b.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function QaAdminPortal({ view }: { view: string }) {
  const router = useRouter();
  const questionId =
    typeof router.query.questionId === "string"
      ? router.query.questionId
      : null;

  const resolvedView =
    view === "dashboard" || view === "inbox" || view === "reviewers"
      ? "inbox"
      : view;

  const currentPath =
    resolvedView === "question" && questionId
      ? "/admin/content/question-review/question"
      : `/admin/content/question-review${
          resolvedView === "inbox" ? "" : `/${resolvedView}`
        }`;

  const isQuestionView = resolvedView === "question" && !!questionId;
  const shellClass = isQuestionView
    ? "w-full px-4 lg:px-6 xl:px-8"
    : "max-w-6xl mx-auto px-4 md:px-6";

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border/60 bg-card/30">
        <div className={cn(shellClass, "py-4")}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold dark:text-slate-100">Question feedback</h1>
              <p className="text-sm text-muted-foreground">
                Review tester comments and mark issues resolved
              </p>
            </div>
            <nav className="flex gap-1">
              {NAV.map((item) => {
                const active =
                  item.href === currentPath ||
                  (item.href === "/admin/content/question-review" &&
                    (currentPath === "/admin/content/question-review" ||
                      currentPath.startsWith("/admin/content/question-review/question")));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className={cn(shellClass, "py-6")}>
        {resolvedView === "inbox" && <QAInbox />}
        {resolvedView === "links" && <UatLinksPanel />}
        {resolvedView === "question" && questionId && (
          <QuestionReviewLayout questionId={questionId} />
        )}
        {resolvedView === "question" && !questionId && (
          <p className="text-muted-foreground">Missing question ID.</p>
        )}
      </div>
    </div>
  );
}

export default QaAdminPortal;
