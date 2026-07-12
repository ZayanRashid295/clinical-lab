"use client";

import type { HighlightItem } from "./annotation-highlight";
import { HighlightedText } from "./HighlightedText";
import { AnnotationHighlighter } from "./AnnotationHighlighter";

type Props = {
  highlightItems: HighlightItem[];
  plainText?: string;
  onItemClick?: (item: HighlightItem) => void;
  children: React.ReactNode;
  className?: string;
};

/** Prefer React text highlights; fall back to DOM marks inside rich HTML. */
export function HighlightedContent({
  highlightItems,
  plainText,
  onItemClick,
  children,
  className,
}: Props) {
  if (!highlightItems.length) {
    return <div className={className}>{children}</div>;
  }

  const text = plainText?.trim();
  if (text) {
    return (
      <HighlightedText
        text={text}
        items={highlightItems}
        onItemClick={onItemClick}
        className={className}
      />
    );
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
