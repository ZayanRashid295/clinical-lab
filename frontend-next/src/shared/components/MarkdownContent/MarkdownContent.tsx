"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { cn } from "@/shared/utils/cn";

export type MarkdownVariant =
  | "default"
  | "assistant"
  | "muted"
  /** MedPrep / brand-primary tinted panels. */
  | "primary"
  | "bubbleIncoming"
  | "bubbleMine"
  /** Patient / left-aligned chat (gray canvas). */
  | "chatPatient"
  /** Student / doctor reply on colored bubble (white text). */
  | "chatAccent"
  /** Doctor / instructor bubble on rose panel (case chat). */
  | "bubbleDoctor";

export interface MarkdownContentProps {
  children: string;
  variant?: MarkdownVariant;
  className?: string;
  /** Merge or override built-in element renderers (advanced). */
  components?: Partial<Components>;
}

type Theme = {
  text: string;
  strong: string;
  muted: string;
  link: string;
  codeInline: string;
  codeBlock: string;
  blockquoteBorder: string;
  hr: string;
  thTdBorder: string;
  theadBg: string;
};

const THEMES: Record<MarkdownVariant, Theme> = {
  default: {
    text: "text-slate-800 dark:text-slate-200",
    strong: "font-semibold text-slate-900 dark:text-slate-50",
    muted: "text-slate-700 dark:text-slate-300",
    link: "text-violet-600 dark:text-violet-400 underline underline-offset-2 font-medium break-words",
    codeInline:
      "rounded bg-slate-200/90 dark:bg-slate-700 px-1 py-0.5 text-[0.85em] font-mono text-slate-900 dark:text-slate-100",
    codeBlock:
      "overflow-x-auto rounded-md bg-slate-200/80 dark:bg-slate-900 p-2 my-2 text-xs text-slate-900 dark:text-slate-100",
    blockquoteBorder: "border-violet-300 dark:border-violet-600",
    hr: "border-slate-200 dark:border-slate-600",
    thTdBorder: "border-slate-200 dark:border-slate-600",
    theadBg: "bg-slate-100 dark:bg-slate-800/80",
  },
  muted: {
    text: "text-muted-foreground",
    strong: "font-semibold text-foreground",
    muted: "text-muted-foreground",
    link: "text-violet-600 dark:text-violet-400 underline underline-offset-2 font-medium break-words",
    codeInline:
      "rounded bg-muted px-1 py-0.5 text-[0.85em] font-mono text-foreground",
    codeBlock: "overflow-x-auto rounded-md bg-muted p-2 my-2 text-xs",
    blockquoteBorder: "border-border",
    hr: "border-border",
    thTdBorder: "border-border",
    theadBg: "bg-muted",
  },
  primary: {
    text: "text-primary",
    strong: "font-semibold text-primary",
    muted: "text-primary/90",
    link: "text-primary underline font-semibold break-words",
    codeInline:
      "rounded bg-primary/10 px-1 py-0.5 text-xs font-mono text-primary break-words",
    codeBlock:
      "overflow-x-auto rounded-md bg-primary/10 p-2 my-2 text-xs text-primary",
    blockquoteBorder: "border-primary/40",
    hr: "border-primary/25",
    thTdBorder: "border-primary/25",
    theadBg: "bg-primary/10",
  },
  assistant: {
    text: "text-slate-900 dark:text-slate-100",
    strong: "font-semibold text-slate-900 dark:text-slate-50",
    muted: "text-slate-800 dark:text-slate-200",
    link: "text-violet-600 dark:text-violet-400 underline underline-offset-2 font-medium break-words",
    codeInline:
      "rounded bg-slate-200/90 dark:bg-slate-700 px-1 py-0.5 text-[0.85em] font-mono text-slate-900 dark:text-slate-100",
    codeBlock:
      "overflow-x-auto rounded-md bg-slate-200/80 dark:bg-slate-900 p-2 my-2 text-xs text-slate-900 dark:text-slate-100",
    blockquoteBorder: "border-violet-300 dark:border-violet-600",
    hr: "border-slate-200 dark:border-slate-600",
    thTdBorder: "border-slate-200 dark:border-slate-600",
    theadBg: "bg-slate-100 dark:bg-slate-800/80",
  },
  bubbleIncoming: {
    text: "text-gray-900 dark:text-gray-100",
    strong: "font-semibold text-gray-950 dark:text-white",
    muted: "text-gray-800 dark:text-gray-200",
    link: "text-violet-600 dark:text-violet-400 underline font-medium break-words",
    codeInline:
      "rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-[0.85em] font-mono",
    codeBlock:
      "overflow-x-auto rounded-md bg-gray-100 dark:bg-gray-950 p-2 my-2 text-xs",
    blockquoteBorder: "border-gray-300 dark:border-gray-600",
    hr: "border-gray-200 dark:border-gray-700",
    thTdBorder: "border-gray-200 dark:border-gray-700",
    theadBg: "bg-gray-50 dark:bg-gray-800/80",
  },
  bubbleMine: {
    text: "text-white",
    strong: "font-semibold text-white",
    muted: "text-primary-50",
    link: "text-primary-100 underline underline-offset-2 font-semibold break-words",
    codeInline:
      "rounded bg-primary-700/90 px-1 py-0.5 text-[0.85em] font-mono text-white",
    codeBlock:
      "overflow-x-auto rounded-md bg-primary-800/90 p-2 my-2 text-xs text-white",
    blockquoteBorder: "border-primary-300/80",
    hr: "border-primary-400/50",
    thTdBorder: "border-primary-400/40",
    theadBg: "bg-primary-800/50",
  },
  chatPatient: {
    text: "text-left text-gray-800 dark:text-slate-100",
    strong: "font-semibold text-gray-900 dark:text-slate-50",
    muted: "text-gray-700 dark:text-slate-200",
    link: "text-primary-600 dark:text-primary-300 underline font-medium break-words",
    codeInline:
      "rounded bg-gray-100 dark:bg-white/10 px-1 py-0.5 text-xs font-mono text-gray-900 dark:text-slate-100",
    codeBlock:
      "overflow-x-auto rounded-md bg-gray-100 dark:bg-white/10 p-2 my-2 text-xs text-gray-900 dark:text-slate-100",
    blockquoteBorder: "border-gray-300 dark:border-white/20",
    hr: "border-gray-200 dark:border-white/15",
    thTdBorder: "border-gray-200 dark:border-white/15",
    theadBg: "bg-gray-100 dark:bg-white/10",
  },
  chatAccent: {
    text: "text-left text-white",
    strong: "font-semibold text-white",
    muted: "text-primary-50",
    link: "text-primary-100 underline font-semibold break-words",
    codeInline: "bg-primary-700/80 px-1 py-0.5 rounded text-xs font-mono text-white",
    codeBlock: "overflow-x-auto rounded-md bg-primary-800/80 p-2 my-2 text-xs text-white",
    blockquoteBorder: "border-primary-200/60",
    hr: "border-primary-200/40",
    thTdBorder: "border-primary-200/40",
    theadBg: "bg-primary-700/50",
  },
  bubbleDoctor: {
    text: "text-left text-rose-900 dark:text-rose-100",
    strong: "font-semibold text-rose-950 dark:text-rose-50",
    muted: "text-rose-800 dark:text-rose-200",
    link: "text-rose-700 dark:text-rose-300 underline font-semibold break-words",
    codeInline:
      "rounded bg-rose-100 dark:bg-rose-500/20 px-1 py-0.5 text-xs font-mono text-rose-900 dark:text-rose-100",
    codeBlock:
      "overflow-x-auto rounded-md bg-rose-100/90 dark:bg-rose-500/15 p-2 my-2 text-xs text-rose-900 dark:text-rose-100",
    blockquoteBorder: "border-rose-300 dark:border-rose-500/40",
    hr: "border-rose-200 dark:border-rose-500/30",
    thTdBorder: "border-rose-200 dark:border-rose-500/30",
    theadBg: "bg-rose-100/80 dark:bg-rose-500/20",
  },
};

function buildComponents(theme: Theme, variant: MarkdownVariant): Components {
  return {
    p: ({ ...props }) => (
      <p className={cn("mb-2 last:mb-0 leading-relaxed text-left", theme.text)} {...props} />
    ),
    strong: ({ ...props }) => <strong className={theme.strong} {...props} />,
    em: ({ ...props }) => <em className={cn("italic", theme.muted)} {...props} />,
    h1: ({ ...props }) => (
      <h1
        className={cn(
          "text-left text-lg font-bold mt-3 mb-2 first:mt-0",
          theme.text
        )}
        {...props}
      />
    ),
    h2: ({ ...props }) => (
      <h2
        className={cn(
          "text-left text-base font-bold mt-3 mb-1.5 first:mt-0",
          theme.text
        )}
        {...props}
      />
    ),
    h3: ({ ...props }) => (
      <h3
        className={cn(
          "text-left text-sm font-bold mt-2.5 mb-1 first:mt-0",
          theme.text
        )}
        {...props}
      />
    ),
    h4: ({ ...props }) => (
      <h4 className={cn("text-left text-sm font-semibold mt-2 mb-1", theme.text)} {...props} />
    ),
    ul: ({ ...props }) => (
      <ul
        className={cn(
          "text-left list-disc list-outside ml-4 mb-2 space-y-1",
          theme.text
        )}
        {...props}
      />
    ),
    ol: ({ ...props }) => (
      <ol
        className={cn(
          "text-left list-decimal list-outside ml-4 mb-2 space-y-1",
          theme.text
        )}
        {...props}
      />
    ),
    li: ({ ...props }) => <li className="leading-relaxed pl-0.5 mb-1 last:mb-0" {...props} />,
    hr: ({ ...props }) => (
      <hr className={cn("my-3 border-t", theme.hr)} {...props} />
    ),
    blockquote: ({ ...props }) => (
      <blockquote
        className={cn(
          "text-left border-l-4 pl-3 my-2 italic",
          theme.blockquoteBorder,
          theme.muted
        )}
        {...props}
      />
    ),
    a: ({ ...props }) => (
      <a
        className={theme.link}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<"code">) => {
      const inline = !className?.includes("language-");
      if (inline) {
        return (
          <code className={theme.codeInline} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ ...props }) => <pre className={theme.codeBlock} {...props} />,
    table: ({ ...props }) => (
      <div className="my-2 -mx-1 overflow-x-auto">
        <table
          className={cn(
            "min-w-full text-xs border-collapse border rounded-md text-left",
            theme.thTdBorder
          )}
          {...props}
        />
      </div>
    ),
    thead: ({ ...props }) => (
      <thead className={cn(theme.theadBg)} {...props} />
    ),
    tbody: ({ ...props }) => <tbody {...props} />,
    tr: ({ ...props }) => (
      <tr className={cn("border-b last:border-0", theme.thTdBorder)} {...props} />
    ),
    th: ({ ...props }) => (
      <th
        className={cn(
          "border px-2 py-1.5 text-left font-semibold",
          theme.thTdBorder,
          theme.text
        )}
        {...props}
      />
    ),
    td: ({ ...props }) => (
      <td
        className={cn(
          "border px-2 py-1.5 align-top text-sm",
          theme.thTdBorder,
          theme.text
        )}
        {...props}
      />
    ),
  };
}

const COMPONENTS_CACHE: Partial<Record<MarkdownVariant, Components>> = {};

function getComponentsForVariant(variant: MarkdownVariant): Components {
  if (!COMPONENTS_CACHE[variant]) {
    COMPONENTS_CACHE[variant] = buildComponents(THEMES[variant], variant);
  }
  return COMPONENTS_CACHE[variant]!;
}

/**
 * Renders Markdown + GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks).
 * Use across the app for AI replies, discussion bodies, and structured text.
 */
export function MarkdownContent({
  children,
  variant = "default",
  className,
  components: componentsOverride,
}: MarkdownContentProps) {
  const components = useMemo(() => {
    const base = getComponentsForVariant(variant);
    if (!componentsOverride) return base;
    return { ...base, ...componentsOverride };
  }, [variant, componentsOverride]);

  const src = children ?? "";

  return (
    <div className={cn("[&>:first-child]:mt-0", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {src}
      </ReactMarkdown>
    </div>
  );
}

export const markdownRemarkPlugins = [remarkGfm];
