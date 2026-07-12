"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

const RATING_FIELDS = [
  { key: "medicalAccuracy", label: "Medical accuracy" },
  { key: "explanationQuality", label: "Explanation" },
] as const;

type Props = {
  initialStatus?: string;
  initialRatings?: Record<string, number>;
  initialNote?: string;
  onSubmit: (data: {
    productionStatus: string;
    ratings: Record<string, number>;
    decisionNote?: string;
  }) => Promise<void>;
};

export function ApprovalCard({
  initialStatus,
  initialRatings,
  initialNote,
  onSubmit,
}: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>(
    initialRatings ?? {}
  );
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (productionStatus: string) => {
    setSaving(true);
    try {
      await onSubmit({ productionStatus, ratings, decisionNote: note || undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {RATING_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="text-xs text-muted-foreground">{field.label}</label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRatings((r) => ({ ...r, [field.key]: n }))}
                  className={`h-7 w-7 rounded text-xs border ${
                    ratings[field.key] === n
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note"
        rows={2}
        className="text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={saving}
          onClick={() => submit("APPROVED")}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={saving}
          onClick={() => submit("NEEDS_REVISION")}
        >
          Needs revision
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => submit("REJECTED")}
        >
          Reject
        </Button>
      </div>

      {initialStatus && (
        <p className="text-xs text-muted-foreground">Current: {initialStatus}</p>
      )}
    </div>
  );
}
