"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { TextSelectionToolbar } from "./TextSelectionToolbar";
import type { ReviewAnnotationTarget } from "./review-types";
import { useReviewContext } from "./ReviewContext";

type Props = {
  containerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  defaultSection?: string;
  defaultTargetType?: ReviewAnnotationTarget;
};

let selectionTargetCounter = 0;

export function useTextSelectionReview({
  containerRef,
  enabled,
  defaultSection = "Content",
  defaultTargetType = "EXPLANATION",
}: Props) {
  const { openDrawer } = useReviewContext();
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const suppressMouseUpRef = useRef(false);
  const [toolbar, setToolbar] = useState<{
    x: number;
    y: number;
    anchorY: number;
    text: string;
    section: string;
    targetType: ReviewAnnotationTarget;
    targetKey: string;
  } | null>(null);

  const openFeedbackForSelection = (selection: NonNullable<typeof toolbar>) => {
    suppressMouseUpRef.current = true;
    openDrawer({
      targetType: selection.targetType,
      targetKey: selection.targetKey,
      section: selection.section,
      selectedText: selection.text,
      anchorY: selection.anchorY,
    });
    setToolbar(null);
    window.getSelection()?.removeAllRanges();
    window.setTimeout(() => {
      suppressMouseUpRef.current = false;
    }, 0);
  };

  useEffect(() => {
    if (!enabled) return;

    const onMouseUp = (e: MouseEvent) => {
      if (suppressMouseUpRef.current) return;
      if (toolbarRef.current?.contains(e.target as Node)) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setToolbar(null);
        return;
      }

      const text = sel.toString().trim();
      if (!text || text.length < 2) {
        setToolbar(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setToolbar(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      let section = defaultSection;
      let targetType = defaultTargetType;
      let targetKey = `${defaultTargetType.toLowerCase()}:selection`;

      const el = (
        range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? (range.commonAncestorContainer as Element)
          : range.commonAncestorContainer.parentElement
      )?.closest("[data-review-section]");

      if (el) {
        section = el.getAttribute("data-review-section") || section;
        targetKey =
          el.getAttribute("data-review-target") ||
          `${section.toLowerCase().replace(/\s+/g, "-")}:selection`;
        const tt = el.getAttribute("data-review-type");
        if (tt) targetType = tt as ReviewAnnotationTarget;
      }

      selectionTargetCounter += 1;
      setToolbar({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        anchorY: rect.top + rect.height / 2,
        text,
        section,
        targetType,
        targetKey: `${targetKey}:sel-${selectionTargetCounter}`,
      });
    };

    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [enabled, containerRef, defaultSection, defaultTargetType]);

  const Toolbar = toolbar ? (
    <TextSelectionToolbar
      ref={toolbarRef}
      x={toolbar.x}
      y={toolbar.y}
      onAddFeedback={() => openFeedbackForSelection(toolbar)}
    />
  ) : null;

  return { Toolbar };
}
