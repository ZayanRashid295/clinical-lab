"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import {
  Sparkles,
  Plus,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  MessageCircle,
  Pin,
  PinOff,
  Archive,
} from "lucide-react";
import {
  aiTutorService,
  type AiTutorConversation,
  type AiTutorConversationDetail,
  type AiTutorMessage,
} from "@/app/services/launch";

const SUGGESTIONS = [
  "Explain Bayes' theorem in clinical reasoning.",
  "How do I distinguish stable angina from unstable angina?",
  "Make a 5-step study plan for cardiology this week.",
  "Quiz me on common acid-base disorders.",
];

export default function AiTutorPage() {
  const [convos, setConvos] = useState<AiTutorConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<AiTutorConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConvos = async () => {
    try {
      const list = await aiTutorService.listConversations();
      setConvos(Array.isArray(list) ? list : []);
      if (!activeId && list.length > 0) {
        setActiveId(list[0].id);
      }
    } catch {
      setConvos([]);
    }
  };

  const loadActive = async () => {
    if (!activeId) {
      setActive(null);
      return;
    }
    try {
      setActive(await aiTutorService.getConversation(activeId));
    } catch {
      setActive(null);
    }
  };

  useEffect(() => {
    loadConvos();
  }, []);

  useEffect(() => {
    loadActive();
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages.length, sending]);

  const onNewChat = async () => {
    setCreating(true);
    try {
      const c = await aiTutorService.createConversation({
        title: "New conversation",
      });
      await loadConvos();
      setActiveId(c.id);
    } finally {
      setCreating(false);
    }
  };

  const onSend = async (text?: string) => {
    const content = (text ?? draft).trim();
    if (!content) return;
    let convoId = activeId;
    if (!convoId) {
      const c = await aiTutorService.createConversation({});
      await loadConvos();
      convoId = c.id;
      setActiveId(c.id);
    }
    setDraft("");
    setSending(true);
    setActive((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: `tmp-${Date.now()}`,
                conversationId: convoId!,
                role: "USER",
                content,
                createdAt: new Date().toISOString(),
              } as AiTutorMessage,
            ],
          }
        : prev
    );
    try {
      await aiTutorService.sendMessage(convoId!, content);
      await Promise.all([loadActive(), loadConvos()]);
    } catch {
    } finally {
      setSending(false);
    }
  };

  const onTogglePin = async (c: AiTutorConversation) => {
    await aiTutorService.updateConversation(c.id, { pinned: !c.pinned });
    loadConvos();
  };

  const onArchive = async (c: AiTutorConversation) => {
    await aiTutorService.updateConversation(c.id, { archive: true });
    if (c.id === activeId) setActiveId(null);
    loadConvos();
  };

  const onDelete = async (c: AiTutorConversation) => {
    await aiTutorService.deleteConversation(c.id);
    if (c.id === activeId) setActiveId(null);
    loadConvos();
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="text-violet-600" /> AI Tutor
        </h1>
        <p className="text-muted-foreground mt-1">
          Ask anything — get explanations, quizzes, and study help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[60vh]">
        <Card className="h-full">
          <CardContent className="p-3 space-y-2">
            <Button
              onClick={onNewChat}
              disabled={creating}
              className="w-full gap-2"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              New chat
            </Button>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {convos.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No conversations yet.
                </p>
              ) : (
                convos.map((c) => (
                  <div
                    key={c.id}
                    className={`group p-2 rounded text-sm cursor-pointer flex items-center gap-2 ${
                      c.id === activeId
                        ? "bg-violet-100 dark:bg-violet-900/30"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800/40"
                    }`}
                    onClick={() => setActiveId(c.id)}
                  >
                    <MessageCircle className="h-4 w-4 text-violet-600 shrink-0" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(c);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        {c.pinned ? (
                          <PinOff className="h-3 w-3" />
                        ) : (
                          <Pin className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(c);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <Archive className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(c);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {!active || active.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
                <Bot className="h-10 w-10 text-violet-400" />
                <p className="font-medium">How can I help you study today?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-xl">
                  {SUGGESTIONS.map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      className="h-auto py-2 text-left justify-start whitespace-normal"
                      onClick={() => onSend(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              active.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${
                    m.role === "USER" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role !== "USER" && (
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-violet-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-line ${
                      m.role === "USER"
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    {m.content}
                    {m.model && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-[9px] bg-white/10 border-white/20"
                      >
                        {m.model}
                      </Badge>
                    )}
                  </div>
                  {m.role === "USER" && (
                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4 text-violet-500" />
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}
          </div>
          <div className="border-t p-3 flex items-end gap-2">
            <Textarea
              placeholder="Ask anything…"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              className="resize-none"
            />
            <Button onClick={() => onSend()} disabled={sending || !draft.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
