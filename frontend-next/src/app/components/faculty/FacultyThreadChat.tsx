"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/utils/cn";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender?: { id: string; firstName?: string; lastName?: string };
};

type Props = {
  threadId: string | null;
  currentUserId: string | null;
  loadThread: (id: string) => Promise<{ messages: Message[] }>;
  sendMessage: (threadId: string, content: string) => Promise<unknown>;
  header?: React.ReactNode;
  className?: string;
};

export function FacultyThreadChat({
  threadId,
  currentUserId,
  loadThread,
  sendMessage,
  header,
  className,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      const data = await loadThread(threadId);
      setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, [threadId, loadThread]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSend = async () => {
    const text = draft.trim();
    if (!text || !threadId) return;
    setSending(true);
    try {
      await sendMessage(threadId, text);
      setDraft("");
      await refresh();
    } finally {
      setSending(false);
    }
  };

  if (!threadId) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-white/20 dark:text-slate-400",
          className,
        )}
      >
        Select a conversation
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-900/35",
        className,
      )}
    >
      {header ? (
        <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900/30">
          {header}
        </div>
      ) : null}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender?.id === currentUserId;
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                    mine
                      ? "bg-primary-600 text-white dark:bg-primary-600"
                      : "bg-slate-100 text-slate-900 dark:border dark:border-white/10 dark:bg-slate-800 dark:text-slate-100",
                  )}
                >
                  <p>{m.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-primary-100" : "text-slate-500 dark:text-slate-400",
                    )}
                  >
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex gap-2 border-t border-slate-200 p-3 dark:border-white/10">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          rows={2}
          className="min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
        />
        <Button
          type="button"
          disabled={sending || !draft.trim()}
          onClick={() => void onSend()}
          className="shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
