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
  MessageSquare,
  Plus,
  Search,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Pin,
  Lock,
  Loader2,
  Send,
  Reply,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  discussionsService,
  onNotification,
  type Discussion,
  type DiscussionWithReplies,
  type DiscussionContext,
} from "@/app/services/launch";
import { useRealtimeRoom } from "@/app/services/realtime/use-realtime-room";

const CONTEXT_OPTIONS: DiscussionContext[] = [
  "GENERAL",
  "QUESTION",
  "TOPIC",
  "SYSTEM",
  "PRODUCT",
];

function timeAgo(iso: string): string {
  const sec = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function DiscussionsPage() {
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
    segments[0] === "discussions" && segments[1] ? segments[1] : null;

  if (detailId) return <DiscussionDetail id={detailId} />;
  return <DiscussionList />;
}

function DiscussionList() {
  const router = useRouter();
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [context, setContext] = useState<DiscussionContext | "ALL">("ALL");
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    body: "",
    context: "GENERAL" as DiscussionContext,
  });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await discussionsService.list({
        search: search || undefined,
        context: context === "ALL" ? undefined : context,
      });
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [context]);

  const onCreate = async () => {
    if (!draft.title.trim() || !draft.body.trim()) return;
    setCreating(true);
    try {
      const d = await discussionsService.create(draft);
      setShowNew(false);
      setDraft({ title: "", body: "", context: "GENERAL" });
      router.push(`/discussions/${d.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="text-indigo-600" /> Discussions
          </h1>
          <p className="text-muted-foreground mt-1">
            Ask questions, share insights and learn from the community.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New discussion
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search discussions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={context === "ALL" ? "default" : "outline"}
              onClick={() => setContext("ALL")}
            >
              All
            </Button>
            {CONTEXT_OPTIONS.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={context === c ? "default" : "outline"}
                onClick={() => setContext(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-3 text-gray-300" size={42} />
            <p className="font-medium">No discussions yet.</p>
            <p className="text-xs">Be the first to start one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((d) => (
            <Card
              key={d.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/discussions/${d.id}`)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex flex-col items-center text-center min-w-[60px]">
                  <ThumbsUp className="h-4 w-4 text-emerald-500" />
                  <span className="font-bold text-sm">{d.upvotes}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {d.pinned && (
                      <Pin className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    {d.isClosed && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <h3 className="font-semibold truncate">{d.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {d.body}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                    <Badge variant="outline">{d.context}</Badge>
                    <span>•</span>
                    <span>{d.replyCount} replies</span>
                    <span>•</span>
                    <span>Last activity {timeAgo(d.lastActivityAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Start a discussion</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNew(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Textarea
                placeholder="What's on your mind?"
                rows={6}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
              <div className="flex items-center gap-2 flex-wrap">
                {CONTEXT_OPTIONS.map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={draft.context === c ? "default" : "outline"}
                    onClick={() => setDraft({ ...draft, context: c })}
                  >
                    {c}
                  </Button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowNew(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={onCreate}
                  disabled={creating || !draft.title.trim() || !draft.body.trim()}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function DiscussionDetail({ id }: { id: string }) {
  const router = useRouter();
  const [d, setD] = useState<DiscussionWithReplies | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setD(await discussionsService.findOne(id));
    } catch {
      setD(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // Live refresh on relevant push (e.g. someone replies to this thread)
  useEffect(() => {
    return onNotification((n) => {
      const did = (n.data as any)?.discussionId;
      if (did && did === id) load();
    });
  }, [id]);

  // Direct websocket room: replies and vote counts arrive instantly
  useRealtimeRoom("discussion", id, {
    "discussion:reply:created": (payload: any) => {
      const newReply = payload?.reply;
      if (!newReply) return;
      setD((prev) =>
        prev
          ? {
              ...prev,
              replies: [
                ...prev.replies.filter((r) => r.id !== newReply.id),
                newReply,
              ],
              replyCount: payload?.replyCount ?? prev.replyCount + 1,
            }
          : prev
      );
    },
    "discussion:vote:changed": (payload: any) => {
      const upvotes = payload?.upvotes;
      if (typeof upvotes !== "number") return;
      setD((prev) => (prev ? { ...prev, upvotes } : prev));
    },
  });

  const onVote = async (v: 1 | -1) => {
    try {
      await discussionsService.vote(id, v);
      load();
    } catch {}
  };

  const onReply = async () => {
    if (!reply.trim()) return;
    setPosting(true);
    try {
      await discussionsService.reply(id, reply);
      setReply("");
      load();
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-4 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/discussions")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back to discussions
      </Button>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading…
        </div>
      ) : !d ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Discussion not found.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 min-w-[44px]">
                  <button
                    onClick={() => onVote(1)}
                    className="p-1.5 rounded hover:bg-emerald-100 text-emerald-600"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <span className="font-bold">{d.upvotes}</span>
                  <button
                    onClick={() => onVote(-1)}
                    className="p-1.5 rounded hover:bg-red-100 text-red-500"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {d.pinned && (
                      <Badge className="bg-amber-100 text-amber-800">
                        <Pin className="h-3 w-3 mr-1" /> Pinned
                      </Badge>
                    )}
                    {d.isClosed && (
                      <Badge variant="outline">
                        <Lock className="h-3 w-3 mr-1" /> Closed
                      </Badge>
                    )}
                    <Badge variant="outline">{d.context}</Badge>
                  </div>
                  <h1 className="text-2xl font-bold">{d.title}</h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    Posted {timeAgo(d.createdAt)} • {d.replyCount} replies
                  </p>
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">
                    {d.body}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold flex items-center gap-2 mt-4">
            <Reply className="h-4 w-4" /> Replies ({d.replies.length})
          </h2>

          <div className="space-y-2">
            {d.replies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No replies yet — be the first.
              </p>
            ) : (
              d.replies.map((r) => (
                <Card key={r.id} className={r.isAnswer ? "border-emerald-400" : ""}>
                  <CardContent className="p-4">
                    {r.isAnswer && (
                      <Badge className="bg-emerald-100 text-emerald-700 mb-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Marked answer
                      </Badge>
                    )}
                    <p className="text-sm whitespace-pre-line">{r.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {timeAgo(r.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {!d.isClosed && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <Textarea
                  rows={4}
                  placeholder="Write a reply…"
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
                    Post reply
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
