"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  ISSUE_TAGS,
  type ReviewSeverity,
  type ReviewTarget,
} from "./review-types";
import { useReviewContext } from "./ReviewContext";
import { clampFeedbackPanelTop } from "./review-panel-position";

type Props = {
  onSave: (payload: {
    target: ReviewTarget;
    body: string;
    tags: string[];
    severity: ReviewSeverity;
  }) => Promise<boolean | void>;
  saving?: boolean;
};

export function ReviewDrawer({ onSave, saving }: Props) {
  const { drawerOpen, activeTarget, closeDrawer, annotationsForTarget, annotations } =
    useReviewContext();
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [severity, setSeverity] = useState<ReviewSeverity>("MINOR");
  const [panelTop, setPanelTop] = useState(88);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activeTarget) return;
    setBody("");
    setTags([]);
    setSeverity("MINOR");
  }, [activeTarget?.targetKey, activeTarget?.selectedText, activeTarget?.highlightAnnotationId]);

  useLayoutEffect(() => {
    if (!drawerOpen || !activeTarget) return;

    const updatePosition = () => {
      const initial = clampFeedbackPanelTop(activeTarget.anchorY);
      setPanelTop(initial);

      const panel = panelRef.current;
      if (!panel) return;

      const height = panel.offsetHeight;
      const headerRoom = 72;
      const margin = 12;
      const anchor = activeTarget.anchorY;
      const preferred =
        anchor != null ? anchor - Math.min(64, height * 0.2) : initial;
      const maxTop = window.innerHeight - height - margin;
      setPanelTop(Math.max(headerRoom, Math.min(preferred, maxTop)));
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [drawerOpen, activeTarget]);

  useEffect(() => {
    if (!drawerOpen || activeTarget?.viewOnly) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [drawerOpen, activeTarget?.targetKey, activeTarget?.viewOnly]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  if (!mounted || !drawerOpen || !activeTarget) return null;

  const viewingAnnotation = activeTarget.highlightAnnotationId
    ? annotations.find((a) => a.id === activeTarget.highlightAnnotationId)
    : null;
  const isViewMode = Boolean(activeTarget.viewOnly && viewingAnnotation);
  const existing = annotationsForTarget(activeTarget.targetKey);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!body.trim()) return;
    const saved = await onSave({
      target: activeTarget,
      body: body.trim(),
      tags,
      severity,
    });
    if (saved === false) return;
    setBody("");
    setTags([]);
    setSeverity("MINOR");
    closeDrawer();
  };

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close feedback panel"
        className="fixed inset-0 z-[60] bg-black/10 dark:bg-black/30"
        onClick={closeDrawer}
      />
      <aside
        ref={panelRef}
        className={cn(
          "fixed z-[70] flex flex-col w-[min(380px,calc(100vw-1.5rem))]",
          "max-h-[min(520px,calc(100vh-5rem))]",
          "right-3 sm:right-5 rounded-xl border border-border/80",
          "bg-card/98 backdrop-blur-md shadow-2xl",
          "dark:bg-slate-900/98 dark:border-slate-700",
          "animate-in fade-in slide-in-from-right-4 duration-200"
        )}
        style={{ top: panelTop }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-800 shrink-0">
          <div className="min-w-0 pr-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {isViewMode ? "Feedback" : "Add feedback"}
            </p>
            <p className="text-xs text-muted-foreground dark:text-slate-400 truncate">
              {activeTarget.section}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={closeDrawer} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {isViewMode && viewingAnnotation ? (
            <div className="space-y-3">
              {(activeTarget.selectedText || activeTarget.preview) && (
                <div className="rounded-lg bg-muted/50 border px-3 py-2 text-sm dark:bg-slate-800/60 dark:border-slate-700">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    Highlighted text
                  </p>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {activeTarget.selectedText || activeTarget.preview}
                  </p>
                </div>
              )}
              <div className="rounded-lg border p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="outline" className="text-[10px] h-5">
                    {viewingAnnotation.severity.toLowerCase()}
                  </Badge>
                  {(viewingAnnotation.tags ?? []).map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px] h-5">
                      {t}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {viewingAnnotation.body}
                </p>
              </div>
            </div>
          ) : (
            <>
          {(activeTarget.selectedText || activeTarget.preview) && (
            <div className="rounded-lg bg-muted/50 border px-3 py-2 text-sm dark:bg-slate-800/60 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Selected content
              </p>
              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap line-clamp-4">
                {activeTarget.selectedText || activeTarget.preview}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium mb-2 text-slate-900 dark:text-slate-100">
              Issue tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ISSUE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "text-[11px] px-2 py-1 rounded-full border transition-colors",
                    tags.includes(tag)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-slate-900 dark:text-slate-100">
              Severity
            </p>
            <div className="flex gap-2">
              {(["MINOR", "MAJOR", "CRITICAL"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "flex-1 text-xs py-1.5 rounded-md border capitalize",
                    severity === s
                      ? s === "CRITICAL"
                        ? "bg-red-600 text-white border-red-600"
                        : s === "MAJOR"
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-slate-600 text-white border-slate-600"
                      : "dark:border-slate-700 dark:text-slate-300"
                  )}
                >
                  {s.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-slate-900 dark:text-slate-100">
              Comment <span className="text-destructive">*</span>
            </p>
            <Textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Describe the issue or suggestion…"
              className="text-slate-900 dark:text-slate-100 dark:bg-slate-900/80 dark:border-slate-700"
            />
          </div>

          {existing.length > 0 && (
            <div className="space-y-2 pt-2 border-t dark:border-slate-800">
              <p className="text-xs font-medium text-muted-foreground">
                Previous comments here
              </p>
              {existing.map((a) => (
                <div
                  key={a.id}
                  className="text-xs rounded-lg border p-2 dark:border-slate-700 dark:bg-slate-800/40"
                >
                  <div className="flex flex-wrap gap-1 mb-1">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {a.severity.toLowerCase()}
                    </Badge>
                    {(a.tags ?? []).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] h-5">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {a.body}
                  </p>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>

        <div className="p-4 border-t flex gap-2 dark:border-slate-800 shrink-0">
          {isViewMode ? (
            <Button className="flex-1" onClick={closeDrawer}>
              Close
            </Button>
          ) : (
            <>
          <Button variant="outline" className="flex-1" onClick={closeDrawer}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={!body.trim() || saving}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
            </>
          )}
        </div>
      </aside>
    </>,
    document.body
  );
}
