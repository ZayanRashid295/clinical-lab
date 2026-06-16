"use client";

import type { ValidationIssue, ValidationResult } from "./types";

const SECTION_COLORS: Record<string, string> = {
  "Question Id": "text-red-500",
  "Question Stem": "text-rose-400",
  Options: "text-orange-500",
  "Answer Key": "text-orange-400",
  Keywords: "text-yellow-500",
  Explanations: "text-purple-500",
  "Key Concept": "text-violet-500",
  Metadata: "text-indigo-500",
  Diagram: "text-sky-400",
  Document: "text-slate-400",
};

interface ValidationReportProps {
  validation: ValidationResult;
  fileName: string;
}

function IssueCard({ item }: { item: ValidationIssue }) {
  const colorClass = SECTION_COLORS[item.section] ?? "text-slate-400";
  return (
    <div
      className={`rounded-lg border p-3 ${
        item.severity === "error"
          ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
          : "border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-semibold uppercase ${colorClass}`}>
          {item.section}
        </span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            item.severity === "error"
              ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200"
              : "bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
          }`}
        >
          {item.severity}
        </span>
      </div>
      <p className="text-sm text-foreground dark:text-gray-200 mb-2">{item.message}</p>
      <div className="text-xs text-muted-foreground dark:text-gray-400">
        <span className="font-medium">How to fix: </span>
        {item.fix}
      </div>
    </div>
  );
}

export function ValidationReport({ validation, fileName }: ValidationReportProps) {
  const issues = [...validation.errors, ...validation.warnings];
  if (!issues.length && validation.valid) return null;

  return (
    <div
      className={`rounded-lg border p-4 ${
        validation.valid
          ? "border-green-300 dark:border-green-800"
          : "border-red-300 dark:border-red-800"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span
          className={`text-lg font-bold ${
            validation.valid ? "text-green-600" : "text-red-600"
          }`}
        >
          {validation.valid ? "✓" : "✕"}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{fileName}</h4>
          <p className="text-xs text-muted-foreground dark:text-gray-400">
            {validation.summary}
          </p>
          {validation.questionId && (
            <span className="text-xs text-muted-foreground">ID: {validation.questionId}</span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {validation.errors.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200">
              {validation.errors.length} errors
            </span>
          )}
          {validation.warnings.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200">
              {validation.warnings.length} warnings
            </span>
          )}
        </div>
      </div>

      {issues.length > 0 && (
        <div className="grid gap-2">
          {validation.errors.map((item) => (
            <IssueCard key={`${item.code}-${item.message}`} item={item} />
          ))}
          {validation.warnings.map((item) => (
            <IssueCard key={`${item.code}-${item.message}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
