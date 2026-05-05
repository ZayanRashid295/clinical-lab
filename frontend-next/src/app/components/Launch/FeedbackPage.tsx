"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import {
  LifeBuoy,
  Plus,
  ArrowLeft,
  Send,
  Loader2,
  X,
  Bug,
  Lightbulb,
  CreditCard,
  User as UserIcon,
  FileQuestion,
  Sparkles,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import {
  feedbackService,
  onNotification,
  type FeedbackTicket,
  type FeedbackTicketDetail,
  type FeedbackCategory,
  type FeedbackPriority,
  type FeedbackStatus,
  type CreateFeedbackPayload,
} from "@/app/services/launch";
import { authService } from "@/shared";
import { useRealtimeRoom } from "@/app/services/realtime/use-realtime-room";

const CATEGORIES: { value: FeedbackCategory; label: string; Icon: any }[] = [
  { value: "GENERAL", label: "General", Icon: Sparkles },
  { value: "BUG", label: "Bug report", Icon: Bug },
  { value: "FEATURE_REQUEST", label: "Feature request", Icon: Lightbulb },
  { value: "CONTENT", label: "Content issue", Icon: FileQuestion },
  { value: "BILLING", label: "Billing", Icon: CreditCard },
  { value: "ACCOUNT", label: "Account", Icon: UserIcon },
];

const PRIORITIES: FeedbackPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const STATUSES: FeedbackStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_USER",
  "RESOLVED",
  "CLOSED",
];

const STATUS_COLORS: Record<FeedbackStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  WAITING_USER: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-700",
};

function normalizeRoles(user: any): string[] {
  const raw = user?.roles ?? [];
  return raw
    .map((r: any) =>
      typeof r === "string"
        ? r.toUpperCase()
        : String(r?.name || r?.role?.name || "").toUpperCase()
    )
    .filter(Boolean);
}

function useIsStaff() {
  const [isStaff, setIsStaff] = useState(false);
  useEffect(() => {
    try {
      const u = authService.getCurrentUser?.();
      const roles = normalizeRoles(u);
      setIsStaff(roles.some((r) => ["SUPERADMIN", "ADMIN"].includes(r)));
    } catch {
      setIsStaff(false);
    }
  }, []);
  return isStaff;
}

export default function FeedbackPage() {
  const router = useRouter();
  const slugParam = router.query.slug;
  const querySegments = Array.isArray(slugParam)
    ? slugParam
    : typeof slugParam === "string"
      ? [slugParam]
      : [];
  const pathSegments = router.asPath.split("?")[0].split("/").filter(Boolean);
  const segments = querySegments.length > 0 ? querySegments : pathSegments;
  const detailId =
    segments[0] === "feedback" && segments[1] ? segments[1] : null;

  if (detailId) return <TicketDetail id={detailId} />;
  return <TicketList />;
}

function TicketList() {
  const router = useRouter();
  const isStaff = useIsStaff();
  const [items, setItems] = useState<FeedbackTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "ALL">(
    "ALL"
  );
  const [draft, setDraft] = useState<CreateFeedbackPayload>({
    subject: "",
    body: "",
    category: "GENERAL",
    priority: "NORMAL",
  });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = isStaff
        ? await feedbackService.listAll(
            statusFilter === "ALL" ? undefined : statusFilter
          )
        : await feedbackService.listMine();
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isStaff, statusFilter]);

  // Auto-refresh on live notifications relevant to feedback tickets
  useEffect(() => {
    return onNotification((n) => {
      if (n.type === "FEEDBACK_REPLY" || (n.data as any)?.ticketId) load();
    });
  }, [isStaff, statusFilter]);

  const onCreate = async () => {
    if (!draft.subject.trim() || !draft.body.trim()) return;
    setCreating(true);
    try {
      const t = await feedbackService.create(draft);
      setShowNew(false);
      setDraft({
        subject: "",
        body: "",
        category: "GENERAL",
        priority: "NORMAL",
      });
      router.push(`/feedback/${t.id}`);
    } finally {
      setCreating(false);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length };
    for (const t of items) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [items]);

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {isStaff ? (
              <ShieldCheck className="text-emerald-600" />
            ) : (
              <LifeBuoy className="text-cyan-600" />
            )}
            {isStaff ? "Support Inbox" : "Feedback & Support"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isStaff
              ? "Triage and respond to all student feedback and support tickets."
              : "Report bugs, request features, or get help. We'll get back to you here."}
          </p>
        </div>
        {!isStaff && (
          <Button onClick={() => setShowNew(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New ticket
          </Button>
        )}
      </div>

      {isStaff && (
        <div className="flex flex-wrap gap-1.5">
          {(["ALL", ...STATUSES] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s as any)}
              className="gap-1"
            >
              {s.replace("_", " ")}
              {counts[s] !== undefined && (
                <span className="ml-1 text-xs opacity-70">({counts[s]})</span>
              )}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Inbox className="mx-auto mb-3 text-gray-300" size={42} />
            <p className="font-medium">
              {isStaff ? "No tickets to triage." : "No tickets yet."}
            </p>
            <p className="text-xs">
              {isStaff
                ? "When students open tickets, they'll appear here."
                : "Open a ticket to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <Card
              key={t.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/feedback/${t.id}`)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{t.subject}</h3>
                    <Badge className={STATUS_COLORS[t.status]}>
                      {t.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline">{t.category}</Badge>
                    <Badge variant="outline">{t.priority}</Badge>
                    {isStaff && (
                      <Badge variant="outline" className="font-mono">
                        user: {t.userId.slice(0, 8)}…
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {t.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last reply {new Date(t.lastReplyAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showNew && !isStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>New ticket</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Subject"
                value={draft.subject}
                onChange={(e) =>
                  setDraft({ ...draft, subject: e.target.value })
                }
              />
              <Textarea
                rows={6}
                placeholder="Describe the issue or feedback…"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                  Category
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {CATEGORIES.map(({ value, label, Icon }) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={draft.category === value ? "default" : "outline"}
                      className="gap-1 justify-start"
                      onClick={() => setDraft({ ...draft, category: value })}
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                  Priority
                </p>
                <div className="flex gap-1.5">
                  {PRIORITIES.map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={draft.priority === p ? "default" : "outline"}
                      onClick={() => setDraft({ ...draft, priority: p })}
                      className="flex-1"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowNew(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={onCreate}
                  disabled={
                    creating || !draft.subject.trim() || !draft.body.trim()
                  }
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TicketDetail({ id }: { id: string }) {
  const router = useRouter();
  const isStaff = useIsStaff();
  const [t, setT] = useState<FeedbackTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setT(await feedbackService.findOne(id));
    } catch {
      setT(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // Live refresh when a notification mentions this ticket
  useEffect(() => {
    return onNotification((n) => {
      const tid = (n.data as any)?.ticketId;
      if (tid && tid === id) load();
    });
  }, [id]);

  // Direct websocket room for replies and status updates
  useRealtimeRoom("ticket", id, {
    "ticket:reply:created": (payload: any) => {
      const newReply = payload?.reply;
      if (!newReply) return;
      setT((prev) =>
        prev
          ? {
              ...prev,
              replies: [
                ...prev.replies.filter((r) => r.id !== newReply.id),
                newReply,
              ],
            }
          : prev
      );
    },
    "ticket:updated": (payload: any) => {
      const next = payload?.ticket;
      if (!next) return;
      setT((prev) => (prev ? { ...prev, ...next } : prev));
    },
  });

  const onReply = async () => {
    if (!reply.trim()) return;
    setPosting(true);
    try {
      await feedbackService.reply(id, reply);
      setReply("");
      load();
    } finally {
      setPosting(false);
    }
  };

  const onChangeStatus = async (status: FeedbackStatus) => {
    if (!t) return;
    setSavingMeta(true);
    try {
      await feedbackService.update(id, { status });
      await load();
    } finally {
      setSavingMeta(false);
    }
  };

  const onChangePriority = async (priority: FeedbackPriority) => {
    if (!t) return;
    setSavingMeta(true);
    try {
      await feedbackService.update(id, { priority });
      await load();
    } finally {
      setSavingMeta(false);
    }
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-4 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/feedback")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tickets
      </Button>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading…
        </div>
      ) : !t ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Ticket not found.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className={STATUS_COLORS[t.status]}>
                  {t.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline">{t.category}</Badge>
                <Badge variant="outline">Priority: {t.priority}</Badge>
                {isStaff && (
                  <Badge variant="outline" className="font-mono">
                    Filed by: {t.userId.slice(0, 12)}…
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold">{t.subject}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Opened {new Date(t.createdAt).toLocaleString()}
              </p>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">
                {t.body}
              </p>
            </CardContent>
          </Card>

          {isStaff && (
            <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-900/10">
              <CardContent className="p-4 flex flex-wrap items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                  Staff actions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground self-center">
                    Status:
                  </span>
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={t.status === s ? "default" : "outline"}
                      disabled={savingMeta}
                      onClick={() => onChangeStatus(s)}
                    >
                      {s.replace("_", " ")}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground self-center">
                    Priority:
                  </span>
                  {PRIORITIES.map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={t.priority === p ? "default" : "outline"}
                      disabled={savingMeta}
                      onClick={() => onChangePriority(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <h2 className="text-lg font-semibold mt-4">Conversation</h2>

          <div className="space-y-2">
            {t.replies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No replies yet.
              </p>
            ) : (
              t.replies.map((r) => (
                <Card
                  key={r.id}
                  className={
                    r.isStaff
                      ? "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-900/10"
                      : ""
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={
                          r.isStaff
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {r.isStaff ? "Support" : isStaff ? "Student" : "You"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-line">{r.body}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {t.status !== "CLOSED" && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <Textarea
                  rows={4}
                  placeholder={
                    isStaff
                      ? "Reply to the user as Support…"
                      : "Add a reply…"
                  }
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={onReply}
                    disabled={!reply.trim() || posting}
                    className="gap-2"
                  >
                    {posting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isStaff ? "Send reply" : "Reply"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
