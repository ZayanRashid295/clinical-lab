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

function reviewSectionFromNode(node: Node | null): Element | null {
  if (!node) return null;
  const el =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  return el?.closest("[data-review-section][data-review-target]") ?? null;
}

/** Prefer start/end containers so nested HTML selections still resolve a review block. */
function resolveReviewSection(range: Range): Element | null {
  const startEl = reviewSectionFromNode(range.startContainer);
  const endEl = reviewSectionFromNode(range.endContainer);
  if (startEl && endEl && startEl !== endEl) {
    // Cross-block selection — anchor to where the selection began
    return startEl;
  }
  return startEl ?? endEl ?? reviewSectionFromNode(range.commonAncestorContainer);
}

export function useTextSelectionReview({
  containerRef,
  enabled,
  defaultSection = "Explanation",
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

      const el = resolveReviewSection(range);
      // Require a real review target — orphan *:selection keys never highlight
      if (!el) {
        setToolbar(null);
        return;
      }

      const targetAttr = el.getAttribute("data-review-target")?.trim();
      if (!targetAttr) {
        setToolbar(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      const section =
        el.getAttribute("data-review-section") || defaultSection;
      const tt = el.getAttribute("data-review-type");
      const targetType = (tt as ReviewAnnotationTarget) || defaultTargetType;

      selectionTargetCounter += 1;
      setToolbar({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        anchorY: rect.top + rect.height / 2,
        text,
        section,
        targetType,
        targetKey: `${targetAttr}:sel-${selectionTargetCounter}`,
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
