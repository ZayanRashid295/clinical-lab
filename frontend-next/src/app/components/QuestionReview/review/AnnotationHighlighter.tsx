"use client";

import { useLayoutEffect, useRef } from "react";
import {
  applyTextHighlights,
  countAppliedHighlights,
  highlightItemsKey,
  removeHighlightsInRoot,
  type HighlightItem,
} from "./annotation-highlight";

type Props = {
  items: HighlightItem[];
  onItemClick: (item: HighlightItem) => void;
  children: React.ReactNode;
  className?: string;
};

const MAX_RETRIES = 12;
const RETRY_MS = 150;

export function AnnotationHighlighter({
  items,
  onItemClick,
  children,
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onItemClickRef = useRef(onItemClick);
  onItemClickRef.current = onItemClick;

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const itemsKey = highlightItemsKey(items);
  const applyingRef = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let retryTimer: number | null = null;
    let retryCount = 0;

    const apply = () => {
      if (cancelled || applyingRef.current) return;
      const currentItems = itemsRef.current;

      if (!currentItems.length) {
        removeHighlightsInRoot(root);
        return;
      }

      const before = countAppliedHighlights(root, currentItems);
      if (before === currentItems.length) return;

      applyingRef.current = true;
      try {
        applyTextHighlights(root, currentItems, (item) =>
          onItemClickRef.current(item)
        );
      } finally {
        applyingRef.current = false;
      }

      const after = countAppliedHighlights(root, currentItems);
      if (
        after < currentItems.length &&
        retryCount < MAX_RETRIES &&
        !cancelled
      ) {
        retryCount += 1;
        retryTimer = window.setTimeout(apply, RETRY_MS);
      }
    };

    apply();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(apply);
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      cancelled = true;
      if (retryTimer != null) window.clearTimeout(retryTimer);
      observer.disconnect();
      removeHighlightsInRoot(root);
    };
  }, [itemsKey]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
