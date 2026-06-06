import { AlertCircle } from "lucide-react";
import type { BulkMetadataValidationReport } from "./question-metadata-validation";

interface BulkMetadataValidationPanelProps {
  report: BulkMetadataValidationReport;
}

export function BulkMetadataValidationPanel({
  report,
}: BulkMetadataValidationPanelProps) {
  if (report.isComplete) return null;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Complete metadata for every question before creating
          </p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-amber-900 dark:text-amber-200">
            {report.issues.map((issue) => (
              <li key={issue.fileName} className="break-words">
                <span className="font-medium">{issue.fileName}</span>
                {" — "}
                missing {issue.missingLabels.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
