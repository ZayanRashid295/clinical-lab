"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, XCircle, Bookmark, AlertCircle } from "lucide-react";
import Modal from "../../../shared/components/Modal/Modal";
import { Button } from "@/shared/ui/button";
import { ActivityLogsService } from "../../services/admin/activity-logs.service";
import {
  ActivityLog,
  ActivityLogDetailSection,
  ActivityLogFullDetails,
  ActivityLogTestHistoryQuestion,
} from "../../types/activity-log";
import { getApiErrorMessage } from "../../services/base/api-http-error";

interface ActivityLogFullDetailModalProps {
  log: ActivityLog | null;
  isOpen: boolean;
  onClose: () => void;
}

function FieldGrid({ fields }: { fields: ActivityLogDetailSection["fields"] }) {
  if (!fields?.length) return null;
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {fields.map((field) => {
        if (field.value == null || field.value === "") return null;
        return (
          <div key={field.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {field.label}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 break-words whitespace-pre-wrap">
              {String(field.value)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function formatTimeSpent(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function resolveUserAnswerDisplay(q: ActivityLogTestHistoryQuestion): string | null {
  if (q.userAnswerDisplay) return q.userAnswerDisplay;
  if (!q.userAnswer) return null;
  const selected = q.options?.find(
    (o) => o.label.toUpperCase() === q.userAnswer?.trim().toUpperCase(),
  );
  if (selected) return `${selected.label}. ${selected.text}`;
  return q.userAnswer;
}

function resolveCorrectAnswerDisplay(q: ActivityLogTestHistoryQuestion): string | null {
  if (q.correctAnswerDisplay) return q.correctAnswerDisplay;
  const correct = q.options?.find((o) => o.isCorrect);
  if (correct) return `${correct.label}. ${correct.text}`;
  return q.correctAnswer;
}

function isOptionSelected(
  q: ActivityLogTestHistoryQuestion,
  option: { label: string; text: string },
): boolean {
  if (q.userAnswerLabel) return q.userAnswerLabel === option.label;
  if (!q.userAnswer) return false;
  const trimmed = q.userAnswer.trim();
  return (
    trimmed.toUpperCase() === option.label.toUpperCase() ||
    trimmed === option.text
  );
}

function TestHistoryQuestions({
  questions,
}: {
  questions: ActivityLogTestHistoryQuestion[];
}) {
  if (!questions.length) {
    return (
      <p className="text-sm text-gray-500 py-4">No questions recorded for this test.</p>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => {
        const stem = q.stem ?? q.stemPreview ?? "";
        const userDisplay = resolveUserAnswerDisplay(q);
        const correctDisplay = resolveCorrectAnswerDisplay(q);

        return (
          <article
            key={`${q.questionId}-${q.order}`}
            className="rounded-lg border border-gray-200 bg-white overflow-hidden"
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-200 px-2 text-xs font-semibold text-gray-700">
                    {q.order}
                  </span>
                  <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                    {q.title || q.questionId}
                  </h4>
                </div>
                {(q.system || q.topic) && (
                  <p className="text-xs text-gray-500 mt-1 ml-8">
                    {[q.system, q.topic].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {q.isCorrect === true && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                  </span>
                )}
                {q.isCorrect === false && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                    <XCircle className="h-3.5 w-3.5" /> Incorrect
                  </span>
                )}
                {q.isCorrect == null && q.userAnswer && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                    Pending
                  </span>
                )}
                {q.markedForReview && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Bookmark className="h-3.5 w-3.5 fill-current" /> Marked
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {formatTimeSpent(q.timeSpentSeconds)}
                </span>
              </div>
            </header>

            <div className="px-4 py-3 space-y-4">
              {stem && (
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {stem}
                </p>
              )}

              {q.options && q.options.length > 0 ? (
                <ul className="space-y-2">
                  {q.options.map((option) => {
                    const selected = isOptionSelected(q, option);
                    const isCorrectOption = option.isCorrect;
                    const isWrongSelection = selected && !isCorrectOption;

                    let optionClass =
                      "rounded-lg border px-3 py-2.5 text-sm flex gap-2";
                    if (isCorrectOption) {
                      optionClass += " border-green-300 bg-green-50";
                    } else if (isWrongSelection) {
                      optionClass += " border-red-300 bg-red-50";
                    } else if (selected) {
                      optionClass += " border-blue-300 bg-blue-50";
                    } else {
                      optionClass += " border-gray-200 bg-gray-50/50";
                    }

                    return (
                      <li key={option.label} className={optionClass}>
                        <span className="font-semibold text-gray-700 shrink-0">
                          {option.label}.
                        </span>
                        <span className="text-gray-800 flex-1">{option.text}</span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {selected && (
                            <span className="text-xs font-medium text-blue-700">
                              Student
                            </span>
                          )}
                          {isCorrectOption && (
                            <span className="text-xs font-medium text-green-700">
                              Correct
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Student answer
                    </dt>
                    <dd className="mt-1 text-gray-900">
                      {userDisplay ?? (
                        <span className="text-gray-400 italic">Not answered</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Correct answer
                    </dt>
                    <dd className="mt-1 text-gray-900">{correctDisplay ?? "—"}</dd>
                  </div>
                </dl>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SectionBlock({ section }: { section: ActivityLogDetailSection }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
      </div>
      <div className="p-4 space-y-4">
        <FieldGrid fields={section.fields} />

        {section.testHistory && (
          <div className="space-y-4">
            <FieldGrid
              fields={[
                {
                  label: "Test name",
                  value: String(section.testHistory.questionPaper.name ?? "—"),
                },
                {
                  label: "Test type",
                  value: String(section.testHistory.questionPaper.type ?? "—"),
                },
                {
                  label: "Time limit",
                  value: section.testHistory.questionPaper.timeLimitMinutes
                    ? `${section.testHistory.questionPaper.timeLimitMinutes} min`
                    : null,
                },
                {
                  label: "Student",
                  value: section.testHistory.student
                    ? String(
                        (section.testHistory.student as { email?: string }).email ??
                          (section.testHistory.student as { name?: string }).name ??
                          "",
                      )
                    : null,
                },
                {
                  label: "Answered",
                  value: section.testHistory.summary.answered as number | null,
                },
                {
                  label: "Correct",
                  value: section.testHistory.summary.correct as number | null,
                },
                {
                  label: "Marked for review",
                  value: section.testHistory.summary.marked as number | null,
                },
              ]}
            />
            <TestHistoryQuestions questions={section.testHistory.questions} />
          </div>
        )}

        {section.items && section.items.length > 0 && (
          <ul className="space-y-2">
            {section.items.map((item, idx) => (
              <li
                key={idx}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
              >
                {item.label != null && (
                  <span className="font-semibold mr-2">{String(item.label)}.</span>
                )}
                <span>{String(item.text ?? JSON.stringify(item))}</span>
                {item.isCorrect === true && (
                  <span className="ml-2 text-green-700 text-xs">(correct)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function ActivityLogFullDetailModal({
  log,
  isOpen,
  onClose,
}: ActivityLogFullDetailModalProps) {
  const [details, setDetails] = useState<ActivityLogFullDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(() => new ActivityLogsService(), []);

  useEffect(() => {
    if (!isOpen || !log?.id) {
      setDetails(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    service
      .getLogDetails(log.id)
      .then((data) => {
        if (!cancelled) setDetails(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Failed to load full log details"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, log?.id, service]);

  if (!log) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={details?.title ?? "Complete log record"}
      size="full"
    >
      <div className="max-h-[75vh] overflow-y-auto space-y-4 pr-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
            <p className="text-sm">Loading complete log details…</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Could not load details</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && details?.sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
