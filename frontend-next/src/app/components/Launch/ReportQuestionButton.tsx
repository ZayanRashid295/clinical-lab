"use client";

import React, { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";
import { Flag, Loader2, X } from "lucide-react";
import {
  questionReportsService,
  type QuestionReportReason,
} from "@/app/services/launch";
import { useToast } from "@/shared/ui/use-toast";
import { toastApiError } from "@/app/services/base/api-http-error";

interface Props {
  questionId: string;
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "default";
  className?: string;
}

const REASONS: { value: QuestionReportReason; label: string }[] = [
  { value: "INCORRECT_ANSWER", label: "Incorrect answer" },
  { value: "TYPO", label: "Typo / formatting" },
  { value: "UNCLEAR", label: "Unclear wording" },
  { value: "OUTDATED", label: "Outdated information" },
  { value: "DUPLICATE", label: "Duplicate question" },
  { value: "OFFENSIVE", label: "Offensive content" },
  { value: "OTHER", label: "Other" },
];

export default function ReportQuestionButton({
  questionId,
  size = "sm",
  variant = "ghost",
  className = "",
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<QuestionReportReason>("INCORRECT_ANSWER");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await questionReportsService.create({ questionId, reason, details });
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setDetails("");
      }, 1200);
    } catch (e) {
      toastApiError(toast, e, "Couldn’t submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={`gap-1 ${className}`}
        title="Report this question"
      >
        <Flag className="h-4 w-4 text-rose-500" />
        Report
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Report question</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {done ? (
                <p className="text-sm text-emerald-600 text-center py-4">
                  Thanks — your report has been submitted.
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                      Reason
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {REASONS.map((r) => (
                        <Button
                          key={r.value}
                          size="sm"
                          variant={reason === r.value ? "default" : "outline"}
                          className="text-xs"
                          onClick={() => setReason(r.value)}
                        >
                          {r.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    rows={3}
                    placeholder="Add any details (optional)…"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button onClick={submit} disabled={submitting}>
                      {submitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Flag className="h-4 w-4 mr-2" />
                      )}
                      Submit
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
