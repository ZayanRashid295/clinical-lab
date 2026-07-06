"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ShieldAlert, CalendarClock, AlertCircle } from "lucide-react";

export type AiTutorQuotaModalVariant =
  | "not_included"
  | "limit_reached"
  | "generic";

type AiTutorQuotaModalProps = {
  open: boolean;
  onClose: () => void;
  message: string;
  variant: AiTutorQuotaModalVariant;
};

function inferVariant(message: string): AiTutorQuotaModalVariant {
  const m = message.toLowerCase();
  if (/limit reached/.test(m)) return "limit_reached";
  if (
    /not included|quota is set to zero|not on your plan/i.test(m)
  ) {
    return "not_included";
  }
  return "generic";
}

export function aiTutorErrorVariant(message: string): AiTutorQuotaModalVariant {
  return inferVariant(message);
}

export function AiTutorQuotaModal({
  open,
  onClose,
  message,
  variant,
}: AiTutorQuotaModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const Icon =
    variant === "limit_reached"
      ? CalendarClock
      : variant === "not_included"
        ? ShieldAlert
        : AlertCircle;

  const iconWrap =
    variant === "limit_reached"
      ? "bg-amber-100 text-amber-800"
      : variant === "not_included"
        ? "bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200"
        : "bg-slate-100 text-slate-700";

  const title =
    variant === "limit_reached"
      ? "Chat limit reached"
      : variant === "not_included"
        ? "AI Tutor isn’t available on this plan"
        : "Can’t send message";

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-tutor-quota-title"
      onClick={onClose}
    >
      <div
        className="max-h-[min(90vh,560px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}
            >
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="ai-tutor-quota-title"
                className="text-lg font-semibold leading-snug text-slate-900"
              >
                {title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Link href="/landing-page#pricing">
            <Button type="button" variant="outline" className="w-full sm:w-auto border-slate-300">
              View plans
            </Button>
          </Link>
          <Link href="/billing">
            <Button
              type="button"
              className="w-full bg-primary-600 text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500/35 sm:w-auto"
            >
              Subscription and usage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
