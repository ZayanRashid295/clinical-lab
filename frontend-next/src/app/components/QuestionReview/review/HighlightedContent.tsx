"use client";

import type { HighlightItem } from "./annotation-highlight";
import { AnnotationHighlighter } from "./AnnotationHighlighter";

type Props = {
  highlightItems: HighlightItem[];
  onItemClick?: (item: HighlightItem) => void;
  children: React.ReactNode;
  className?: string;
};

/**
 * Apply highlights on the rendered DOM (what the reviewer selected),
 * never by substituting a reconstructed plain-text corpus.
 */
export function HighlightedContent({
  highlightItems,
  onItemClick,
  children,
  className,
}: Props) {
  if (!highlightItems.length) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnnotationHighlighter
      items={highlightItems}
      onItemClick={onItemClick ?? (() => undefined)}
      className={className}
    >
      {children}
    </AnnotationHighlighter>
  );
}
