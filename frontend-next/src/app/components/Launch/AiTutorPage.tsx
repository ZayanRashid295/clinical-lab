"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
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
  BookOpen,
  Stethoscope,
  BrainCircuit,
  FlaskConical,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import {
  aiTutorService,
  type AiTutorConversation,
  type AiTutorConversationDetail,
  type AiTutorMessage,
} from "@/app/services/launch";
import { ApiHttpError, getApiErrorMessage } from "@/app/services/base/api-http-error";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { useToast } from "@/shared/ui/use-toast";
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent";
import {
  AiTutorQuotaModal,
  aiTutorErrorVariant,
  type AiTutorQuotaModalVariant,
} from "@/app/components/Launch/AiTutorQuotaModal";
import { APP_GLASS_CARD } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";

const STARTERS: Array<{
  text: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    text: "Explain Bayes' theorem in clinical reasoning.",
    hint: "Reasoning & stats",
    icon: BrainCircuit,
  },
  {
    text: "How do I distinguish stable angina from unstable angina?",
    hint: "Cardiology pearls",
    icon: Stethoscope,
  },
  {
    text: "Make a 5-step study plan for cardiology this week.",
    hint: "Study planning",
    icon: BookOpen,
  },
  {
    text: "Quiz me on common acid-base disorders.",
    hint: "Quick drill",
    icon: FlaskConical,
  },
];

function formatRelativeShort(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AiTutorPage() {
  const { toast } = useToast();
  const [convos, setConvos] = useState<AiTutorConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<AiTutorConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [quotaModal, setQuotaModal] = useState<{
    message: string;
    variant: AiTutorQuotaModalVariant;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tryOpenAiTutorQuotaModal = useCallback((e: unknown): boolean => {
    if (!ApiHttpError.is(e) || e.status !== 403) return false;
    const msg = (e.message || "").trim();
    if (
      !/ai tutor|chat limit|quota|subscription package|not included/i.test(
        msg.toLowerCase()
      )
    ) {
      return false;
    }
    setQuotaModal({
      message: msg,
      variant: aiTutorErrorVariant(msg),
    });
    return true;
  }, []);

  const loadConvos = useCallback(async () => {
    try {
      const list = await aiTutorService.listConversations();
      setConvos(Array.isArray(list) ? list : []);
      setActiveId((prev) => prev ?? (list?.[0]?.id ?? null));
    } catch {
      setConvos([]);
    }
  }, []);

  const loadActive = useCallback(async () => {
    if (!activeId) {
      setActive(null);
      return;
    }
    try {
      setActive(await aiTutorService.getConversation(activeId));
    } catch {
      setActive(null);
    }
  }, [activeId]);

  useEffect(() => {
    loadConvos();
  }, [loadConvos]);

  useEffect(() => {
    loadActive();
  }, [loadActive]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages.length, sending]);

  const onNewChat = async () => {
    setCreating(true);
    setActionError(null);
    try {
      const c = await aiTutorService.createConversation({
        title: "New conversation",
      });
      await loadConvos();
      setActiveId(c.id);
    } catch (e) {
      const msg = getApiErrorMessage(e, "Could not start a new chat.");
      if (tryOpenAiTutorQuotaModal(e)) return;
      setActionError(msg);
      toast({
        variant: "destructive",
        title: "Could not create conversation",
        description: msg,
      });
    } finally {
      setCreating(false);
    }
  };

  const onSend = async (text?: string) => {
    const content = (text ?? draft).trim();
    if (!content) return;
    setActionError(null);
    let convoId = activeId;
    try {
      if (!convoId) {
        const c = await aiTutorService.createConversation({});
        await loadConvos();
        convoId = c.id;
        setActiveId(c.id);
      }
    } catch (e) {
      const msg = getApiErrorMessage(e, "Could not start a conversation.");
      if (tryOpenAiTutorQuotaModal(e)) return;
      setActionError(msg);
      toast({
        variant: "destructive",
        title: "Chat unavailable",
        description: msg,
      });
      return;
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
    } catch (e) {
      const msg = getApiErrorMessage(
        e,
        "Your message could not be sent. Please try again."
      );
      setDraft(content);
      await Promise.all([loadActive(), loadConvos()]);
      if (tryOpenAiTutorQuotaModal(e)) {
        setActionError(null);
        return;
      }
      setActionError(msg);
      toast({
        variant: "destructive",
        title: "Message not sent",
        description: msg,
      });
    } finally {
      setSending(false);
    }
  };

  const onTogglePin = async (c: AiTutorConversation) => {
    try {
      await aiTutorService.updateConversation(c.id, { pinned: !c.pinned });
      await loadConvos();
    } catch (e) {
      const msg = getApiErrorMessage(e, "Could not update conversation.");
      setActionError(msg);
      toast({ variant: "destructive", title: "Action failed", description: msg });
    }
  };

  const onArchive = async (c: AiTutorConversation) => {
    try {
      await aiTutorService.updateConversation(c.id, { archive: true });
      if (c.id === activeId) setActiveId(null);
      await loadConvos();
    } catch (e) {
      const msg = getApiErrorMessage(e, "Could not archive conversation.");
      setActionError(msg);
      toast({ variant: "destructive", title: "Action failed", description: msg });
    }
  };

  const onDelete = async (c: AiTutorConversation) => {
    try {
      await aiTutorService.deleteConversation(c.id);
      if (c.id === activeId) setActiveId(null);
      await loadConvos();
    } catch (e) {
      const msg = getApiErrorMessage(e, "Could not delete conversation.");
      setActionError(msg);
      toast({ variant: "destructive", title: "Action failed", description: msg });
    }
  };

  const activeTitle =
    active?.title && active.title !== "New conversation"
      ? active.title
      : "New conversation";

  return (
    <div
      className={cn(
        "-m-3 flex h-full min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden p-3 pt-4 sm:gap-5 sm:p-4 lg:p-5",
        "bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(var(--color-primary-500-rgb),0.12),transparent_55%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]",
        "dark:bg-none dark:bg-gradient-to-b dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
      )}
    >
      <header className="w-full shrink-0 px-1 sm:px-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Clinical study assistant
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
                AI Tutor
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/80 bg-white/90 px-2.5 py-0.5 text-xs font-normal text-primary-800 dark:border-primary-700/40 dark:bg-white/5 dark:text-primary-200">
                <ShieldCheck className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                For education only — not medical advice
              </span>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Deep explanations, spaced prompts, and exam-style reasoning—structured like a
              senior resident walking through the material with you.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Session
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Interactive tutor</p>
            </div>
          </div>
        </div>
      </header>

      {actionError && (
        <div className="w-full shrink-0 px-1 sm:px-2">
          <Alert className="border-amber-200/90 bg-amber-50/95 text-amber-950 shadow-sm backdrop-blur-sm dark:bg-amber-950/30 dark:text-amber-50">
            <AlertDescription className="flex flex-wrap items-start justify-between gap-3">
              <span className="leading-relaxed">{actionError}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 text-amber-900 hover:bg-amber-100/90 dark:text-amber-100 dark:hover:bg-amber-900/40"
                onClick={() => setActionError(null)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="grid min-h-0 w-full min-w-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,2fr)] gap-4 lg:min-h-0 lg:grid-cols-[minmax(260px,300px)_1fr] lg:grid-rows-1 lg:gap-5">
        {/* Sidebar */}
        <Card
          className={cn(
            APP_GLASS_CARD,
            "flex min-h-0 flex-col overflow-hidden border-slate-200/90 bg-white/85 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-950/[0.03] backdrop-blur-md dark:bg-slate-900/70 dark:shadow-black/20 dark:ring-white/[0.06]"
          )}
        >
          <div className="shrink-0 bg-gradient-to-br from-primary-600 via-primary-600 to-primary-800 px-3.5 py-3 text-white">
            <div className="flex items-center gap-2">
              <MessagesSquare className="h-4 w-4 opacity-95" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/75">
                  Workspace
                </p>
                <p className="text-sm font-medium leading-tight">Your chats</p>
              </div>
            </div>
          </div>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-2.5 p-3">
            <Button
              onClick={onNewChat}
              disabled={creating}
              className="h-9 w-full shrink-0 gap-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-sm font-medium text-white shadow-sm shadow-primary-500/20 transition hover:from-primary-700 hover:to-primary-800"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              New conversation
            </Button>
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-0.5">
              {convos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center dark:border-white/10 dark:bg-white/5">
                  <MessageCircle className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-500" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No chats yet</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Start with a prompt below or tap{" "}
                    <span className="font-medium text-primary-700 dark:text-primary-300">New conversation</span>.
                  </p>
                </div>
              ) : (
                convos.map((c) => (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveId(c.id);
                      }
                    }}
                    className={`group flex cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all ${
                      c.id === activeId
                        ? "border-primary-200/90 bg-primary-50/80 dark:border-primary-700/45 dark:bg-primary-900/25"
                        : "border-transparent bg-transparent hover:border-slate-200/90 hover:bg-slate-50 dark:hover:border-white/10 dark:hover:bg-white/5"
                    }`}
                    onClick={() => setActiveId(c.id)}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        c.id === activeId
                          ? "bg-primary-600 text-white dark:bg-primary-500"
                          : "bg-slate-100 text-slate-600 group-hover:bg-white dark:bg-white/10 dark:text-slate-300 dark:group-hover:bg-white/15"
                      }`}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">
                          {c.title}
                        </span>
                        <span className="shrink-0 text-[10px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
                          {formatRelativeShort(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        {c.pinned && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(c);
                            }}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
                            aria-label={c.pinned ? "Unpin" : "Pin"}
                          >
                            {c.pinned ? (
                              <PinOff className="h-3.5 w-3.5" />
                            ) : (
                              <Pin className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchive(c);
                            }}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
                            aria-label="Archive"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(c);
                            }}
                            className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main thread */}
        <Card
          className={cn(
            APP_GLASS_CARD,
            "relative flex min-h-0 flex-col overflow-hidden border-slate-200/90 bg-white/90 shadow-md shadow-slate-900/[0.04] ring-1 ring-slate-950/[0.03] backdrop-blur-md dark:bg-slate-900/75 dark:shadow-black/25 dark:ring-white/[0.06]"
          )}
        >
          {active && active.messages.length > 0 && (
            <div className="shrink-0 border-b border-slate-100/90 bg-gradient-to-r from-slate-50/80 to-white px-4 py-2.5 dark:border-white/10 dark:from-white/5 dark:to-transparent">
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Active thread
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                {activeTitle}
              </p>
            </div>
          )}

          <div
            ref={scrollRef}
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
          >
            {!active || active.messages.length === 0 ? (
              <div className="relative flex w-full flex-col items-stretch px-0 py-6">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-40 rounded-full bg-gradient-to-b from-primary-400/15 to-transparent blur-3xl"
                  aria-hidden
                />
                <div className="relative flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 shadow-md shadow-primary-500/20">
                    <Bot className="h-7 w-7 text-white" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-medium tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
                    Where should we focus today?
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Pick a starter or type your own question. Long-form answers stay in this
                    pane—scroll inside the chat, not the whole page.
                  </p>
                </div>

                <div className="relative mt-8 grid w-full gap-2.5 sm:grid-cols-2">
                  {STARTERS.map(({ text, hint, icon: Icon }) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => onSend(text)}
                      className="group flex gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 text-left shadow-sm transition-all hover:border-primary-200/90 hover:shadow dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-primary-700/45 dark:hover:bg-slate-900/70"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 transition group-hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-300 dark:ring-1 dark:ring-primary-500/20 dark:group-hover:bg-primary-900/50">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-medium uppercase tracking-wide text-primary-600/90 dark:text-primary-400/90">
                          {hint}
                        </span>
                        <span className="mt-1 block text-sm font-medium leading-snug text-slate-800 dark:text-slate-200">
                          {text}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4 pb-4">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex w-full min-w-0 gap-3 ${m.role === "USER" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role !== "USER" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 dark:from-primary-900/45 dark:to-primary-800/35 dark:text-primary-300">
                        <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </div>
                    )}
                    <div
                      className={`min-w-0 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === "USER"
                          ? "max-w-[min(100%,42rem)] shrink-0 rounded-tr-sm bg-primary-600 text-white shadow-sm shadow-primary-500/15"
                          : "max-w-none flex-1 rounded-tl-sm border border-slate-100/90 bg-slate-50/90 text-slate-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                      }`}
                    >
                      {m.role === "USER" ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-headings:my-3 [&>:first-child]:mt-0">
                          <MarkdownContent variant="assistant">{m.content}</MarkdownContent>
                        </div>
                      )}
                      <p
                        className={`mt-2 text-[10px] font-medium tabular-nums ${
                          m.role === "USER" ? "text-white/75" : "text-slate-400"
                        }`}
                      >
                        {formatRelativeShort(m.createdAt)}
                      </p>
                    </div>
                    {m.role === "USER" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white dark:bg-white/15 dark:text-slate-100">
                        <User className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </div>
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="flex items-center gap-2 pl-12 text-sm text-slate-500">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/40">
                      <Bot className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </span>
                    <Loader2 className="h-4 w-4 animate-spin text-primary-500 dark:text-primary-400" />
                    <span className="font-medium">Thinking…</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-100/90 bg-slate-50/80 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/90 dark:backdrop-blur-md">
            <div className="flex w-full min-w-0 items-end gap-2.5">
              <div className="relative min-w-0 flex-1">
                <Textarea
                  placeholder="Ask a mechanism, request a quiz, or paste a vignette…"
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  className="min-h-[44px] resize-none rounded-lg border-slate-200/90 bg-white pr-3 text-sm text-slate-900 shadow-inner ring-0 transition placeholder:text-slate-400 focus-visible:ring-[1.5px] focus-visible:ring-primary-500/30 dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:border-white/15 dark:bg-slate-800 dark:text-slate-300">
                    Enter
                  </kbd>{" "}
                  to send ·{" "}
                  <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:border-white/15 dark:bg-slate-800 dark:text-slate-300">
                    Shift+Enter
                  </kbd>{" "}
                  new line
                </p>
              </div>
              <Button
                type="button"
                size="default"
                onClick={() => onSend()}
                disabled={sending || !draft.trim()}
                className="h-11 min-w-[44px] shrink-0 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-4 font-medium text-white shadow-sm shadow-primary-500/20 hover:from-primary-700 hover:to-primary-800 disabled:opacity-40"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <AiTutorQuotaModal
        open={quotaModal !== null}
        onClose={() => setQuotaModal(null)}
        message={quotaModal?.message ?? ""}
        variant={quotaModal?.variant ?? "generic"}
      />
    </div>
  );
}
