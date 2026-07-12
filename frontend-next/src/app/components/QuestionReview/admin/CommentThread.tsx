"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { formatDate } from "./qa-admin-utils";

type Comment = {
  id: string;
  authorName: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
};

type Props = {
  issueTitle: string;
  issueBody: string;
  selectedText?: string | null;
  comments: Comment[];
  onReply: (body: string, isInternal: boolean) => Promise<void>;
};

export function CommentThread({
  issueTitle,
  issueBody,
  selectedText,
  comments,
  onReply,
}: Props) {
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      await onReply(reply.trim(), false);
      setReply("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 p-3 bg-muted/20 text-sm">
        <p className="font-medium dark:text-slate-100">{issueTitle}</p>
        <p className="mt-1 dark:text-slate-200">{issueBody}</p>
        {selectedText && (
          <blockquote className="mt-2 border-l-2 border-primary/40 pl-2 text-xs italic text-muted-foreground">
            &ldquo;{selectedText}&rdquo;
          </blockquote>
        )}
      </div>

      {comments.map((c) => (
        <div
          key={c.id}
          className="rounded-lg border border-border/60 p-2 text-sm dark:text-slate-200"
        >
          <p className="text-[10px] text-muted-foreground mb-1">
            {c.authorName} · {formatDate(c.createdAt)}
          </p>
          {c.body}
        </div>
      ))}

      <div className="space-y-2 pt-2 border-t border-border/60">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply…"
          rows={3}
          className="text-sm"
        />
        <Button size="sm" className="w-full" onClick={submit} disabled={saving || !reply.trim()}>
          {saving ? "Sending…" : "Send reply"}
        </Button>
      </div>
    </div>
  );
}
