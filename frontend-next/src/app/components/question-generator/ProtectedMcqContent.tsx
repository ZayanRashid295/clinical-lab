"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/shared/utils/cn";

export type McqContentProtectionMode = "strict" | "allowSelection";

type ProtectedMcqContentProps = {
  children: ReactNode;
  className?: string;
  /**
   * `strict` — no text selection; blocks copy/cut/paste/drag (practice, tests, demo).
   * `allowSelection` — selection stays enabled for QA feedback highlights; still blocks
   * copy/cut/paste/drag. Form fields inside the zone remain fully usable.
   */
  mode?: McqContentProtectionMode;
  /** When false, renders a plain container with no protection (e.g. admin preview). */
  enabled?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""]',
    ),
  );
}

function clearClipboard(event: ClipboardEvent) {
  event.preventDefault();
  try {
    event.clipboardData?.setData("text/plain", "");
    event.clipboardData?.setData("text/html", "");
  } catch {
    // Some browsers restrict clipboard mutation; preventDefault is enough.
  }
}

/**
 * Soft content-protection shell for MCQ stem / choices / explanation.
 * Deterrence only (not DRM): blocks common copy paths in the browser UI.
 */
export function ProtectedMcqContent({
  children,
  className,
  mode = "strict",
  enabled = true,
  ...rest
}: ProtectedMcqContentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const allowSelection = mode === "allowSelection";
  const protectionOn = enabled;

  const isInsideProtected = useCallback((target: EventTarget | null) => {
    const root = rootRef.current;
    if (!root || !(target instanceof Node)) return false;
    return root.contains(target);
  }, []);

  const selectionTouchesProtected = useCallback(() => {
    const root = rootRef.current;
    const sel = window.getSelection();
    if (!root || !sel || sel.isCollapsed || !sel.rangeCount) return false;
    try {
      return root.contains(sel.getRangeAt(0).commonAncestorContainer);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!protectionOn) return;

    const onCopyOrCut = (event: ClipboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (
        isInsideProtected(event.target) ||
        selectionTouchesProtected()
      ) {
        clearClipboard(event);
      }
    };

    const onPaste = (event: ClipboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (isInsideProtected(event.target)) {
        event.preventDefault();
      }
    };

    const onDragStart = (event: DragEvent) => {
      if (isEditableTarget(event.target)) return;
      if (isInsideProtected(event.target)) {
        event.preventDefault();
      }
    };

    const onSelectStart = (event: Event) => {
      if (allowSelection) return;
      if (isEditableTarget(event.target)) return;
      if (isInsideProtected(event.target)) {
        event.preventDefault();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (!isInsideProtected(event.target) && !selectionTouchesProtected()) {
        return;
      }

      const key = event.key.toLowerCase();
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;

      // Block copy / cut / paste. In strict mode also block select-all.
      if (
        key === "c" ||
        key === "x" ||
        key === "v" ||
        (!allowSelection && key === "a")
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener("copy", onCopyOrCut, true);
    document.addEventListener("cut", onCopyOrCut, true);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("dragstart", onDragStart, true);
    document.addEventListener("selectstart", onSelectStart, true);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("copy", onCopyOrCut, true);
      document.removeEventListener("cut", onCopyOrCut, true);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("dragstart", onDragStart, true);
      document.removeEventListener("selectstart", onSelectStart, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [
    allowSelection,
    isInsideProtected,
    protectionOn,
    selectionTouchesProtected,
  ]);

  if (!protectionOn) {
    return (
      <div ref={rootRef} className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      data-mcq-protected={mode}
      className={cn(
        allowSelection
          ? "select-text"
          : "select-none [-webkit-touch-callout:none]",
        className,
      )}
      onContextMenu={(event) => {
        if (isEditableTarget(event.target)) return;
        // Strict: no context menu on content. Allow-selection: keep menu for UX;
        // copy is still blocked via the clipboard listeners.
        if (!allowSelection) {
          event.preventDefault();
        }
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
