"use client";

import React, { useEffect, useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  Users,
  Plus,
  ArrowLeft,
  Send,
  Lock,
  Globe,
  Loader2,
  LogIn,
  LogOut,
  Hash,
  Pin,
  Copy,
  X,
} from "lucide-react";
import {
  studyGroupsService,
  onNotification,
  type StudyGroup,
  type StudyGroupDetail,
  type CreateStudyGroupPayload,
} from "@/app/services/launch";
import { useRealtimeRoom } from "@/app/services/realtime/use-realtime-room";
import { UserIdentity } from "@/shared/components/Common/UserIdentity";
import { MessageBubble } from "@/shared/components/Common/MessageBubble";
import { authService } from "@/shared";

const COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-indigo-500",
];

export default function StudyGroupsPage() {
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
    segments[0] === "study-groups" && segments[1] ? segments[1] : null;

  if (detailId) return <GroupDetail id={detailId} />;
  return <GroupList />;
}

function GroupList() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "mine">("mine");
  const [items, setItems] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState("");
  const [draft, setDraft] = useState<CreateStudyGroupPayload>({
    name: "",
    description: "",
    category: "General",
    icon: "📚",
    color: "bg-emerald-500",
    isPrivate: false,
  });
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await studyGroupsService.list({
        mineOnly: tab === "mine",
      });
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const onCreate = async () => {
    if (!draft.name.trim()) return;
    setCreating(true);
    try {
      const g = await studyGroupsService.create(draft);
      setShowNew(false);
      setDraft({
        name: "",
        description: "",
        category: "General",
        icon: "📚",
        color: "bg-emerald-500",
        isPrivate: false,
      });
      router.push(`/study-groups/${g.id}`);
    } finally {
      setCreating(false);
    }
  };

  const onJoinByCode = async () => {
    if (!code.trim()) return;
    setJoining(true);
    try {
      const r: any = await studyGroupsService.joinByCode(code.trim());
      setShowJoin(false);
      setCode("");
      if (r?.groupId) router.push(`/study-groups/${r.groupId}`);
      else load();
    } catch (e: any) {
      alert(e?.message || "Invalid invite code");
    } finally {
      setJoining(false);
    }
  };

  const onJoin = async (g: StudyGroup) => {
    try {
      await studyGroupsService.join(g.id);
      router.push(`/study-groups/${g.id}`);
    } catch (e: any) {
      alert(e?.message || "Could not join group");
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 pb-10 pt-6 space-y-4 w-full max-w-none">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="text-teal-600" /> Study Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with peers, share notes and study together.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowJoin(true)} className="gap-2">
            <LogIn className="h-4 w-4" /> Join with code
          </Button>
          <Button onClick={() => setShowNew(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create group
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={tab === "mine" ? "default" : "outline"}
          onClick={() => setTab("mine")}
        >
          My groups
        </Button>
        <Button
          variant={tab === "all" ? "default" : "outline"}
          onClick={() => setTab("all")}
        >
          Discover
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 text-gray-300" size={42} />
            <p className="font-medium">No groups yet.</p>
            <p className="text-xs">Create one or join with an invite code.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((g) => (
            <Card
              key={g.id}
              className="hover:shadow-md transition-shadow flex flex-col"
            >
              <CardContent className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl text-white shrink-0 ${g.color}`}
                  >
                    {g.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate flex items-center gap-1.5">
                      {g.isPrivate ? (
                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      {g.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {g.description || "No description"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="outline">{g.category}</Badge>
                  <span>{g.memberCount} member{g.memberCount === 1 ? "" : "s"}</span>
                </div>
                <div className="mt-auto flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/study-groups/${g.id}`)}
                  >
                    Open
                  </Button>
                  {tab === "all" && (
                    <Button onClick={() => onJoin(g)}>Join</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showNew && (
        <ModalShell title="Create group" onClose={() => setShowNew(false)}>
          <Input
            placeholder="Group name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <Textarea
            rows={3}
            placeholder="Description (optional)"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <Input
            placeholder="Category (e.g. Cardiology)"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">Color</span>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-7 h-7 rounded-full ${c} ring-2 ${
                  draft.color === c ? "ring-foreground" : "ring-transparent"
                }`}
                onClick={() => setDraft({ ...draft, color: c })}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">Icon</span>
            {["📚", "🩺", "🧬", "🧠", "💉", "🦠", "🩻", "⚕️"].map((i) => (
              <button
                key={i}
                type="button"
                className={`w-9 h-9 rounded text-lg ${
                  draft.icon === i
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setDraft({ ...draft, icon: i })}
              >
                {i}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!draft.isPrivate}
              onChange={(e) =>
                setDraft({ ...draft, isPrivate: e.target.checked })
              }
            />
            Private (joined via invite code only)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button
              onClick={onCreate}
              disabled={creating || !draft.name.trim()}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create
            </Button>
          </div>
        </ModalShell>
      )}

      {showJoin && (
        <ModalShell title="Join with invite code" onClose={() => setShowJoin(false)}>
          <Input
            placeholder="Enter invite code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowJoin(false)}>
              Cancel
            </Button>
            <Button onClick={onJoinByCode} disabled={joining || !code.trim()}>
              {joining ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Join
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function GroupDetail({ id }: { id: string }) {
  const router = useRouter();
  const [g, setG] = useState<StudyGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState("");
  const [posting, setPosting] = useState(false);
  const meId = authService.getCurrentUser?.()?.id as string | undefined;
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setG(await studyGroupsService.findOne(id));
    } catch {
      setG(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // Live refresh on relevant push (e.g. another member posts)
  useEffect(() => {
    return onNotification((n) => {
      const gid = (n.data as any)?.groupId;
      if (gid && gid === id) load();
    });
  }, [id]);

  // Direct room-scoped events (faster than the notification round-trip)
  useRealtimeRoom("group", id, {
    "group:post:created": (payload: any) => {
      const newPost = payload?.post;
      if (!newPost) return;
      setG((prev) =>
        prev
          ? {
              ...prev,
              posts: [
                newPost,
                ...prev.posts.filter((p) => p.id !== newPost.id),
              ],
            }
          : prev
      );
    },
    "group:member:joined": () => load(),
  });

  const onPost = async () => {
    if (!post.trim()) return;
    setPosting(true);
    try {
      await studyGroupsService.createPost(id, { body: post });
      setPost("");
      load();
    } finally {
      setPosting(false);
    }
  };

  const onLeave = async () => {
    setLeaving(true);
    try {
      await studyGroupsService.leave(id);
      router.push("/study-groups");
    } finally {
      setLeaving(false);
      setLeaveOpen(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 pb-6 pt-6 w-full max-w-none h-[calc(100dvh-80px)] overflow-hidden flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/study-groups")}
        className="gap-2 shrink-0 self-start"
      >
        <ArrowLeft className="h-4 w-4" /> Back to groups
      </Button>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading…
        </div>
      ) : !g ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Group not found or you don't have access.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shrink-0">
            <CardContent className="p-6 flex items-start gap-4 flex-wrap">
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl text-white shrink-0 ${g.color}`}
              >
                {g.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                  {g.isPrivate && <Lock className="h-4 w-4 text-amber-600" />}
                  {g.name}
                  <Badge variant="outline">{g.category}</Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{g.description || "No description"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                </p>
                {g.isPrivate && g.inviteCode && (
                  <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                    <Hash className="h-3 w-3" />
                    {g.inviteCode}
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(g.inviteCode!);
                      }}
                      className="hover:text-emerald-600"
                      title="Copy invite code"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                <Button
                  variant="outline"
                  onClick={() => setLeaveOpen(true)}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" /> Leave
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave this group?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You’ll stop receiving new posts and notifications from{" "}
                      <span className="font-semibold">{g.name}</span>. You can
                      re-join later if the group is public (or via invite code
                      if it’s private).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={leaving}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onLeave}
                      disabled={leaving}
                      className="bg-rose-600 hover:bg-rose-700"
                    >
                      {leaving ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Leaving…
                        </span>
                      ) : (
                        "Leave group"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 flex-1 overflow-hidden items-stretch">
            <div className="space-y-3 flex flex-col min-w-0 h-full overflow-hidden">
              <Card className="shrink-0">
                <CardContent className="p-4 space-y-2">
                  <Textarea
                    placeholder="Share something with the group…"
                    rows={3}
                    value={post}
                    onChange={(e) => setPost(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={onPost}
                      disabled={!post.trim() || posting}
                      className="gap-2"
                    >
                      {posting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Post
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                {g.posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No posts yet.
                  </p>
                ) : (
                  g.posts.map((p) => (
                    <div key={p.id} className={p.pinned ? "pt-2" : ""}>
                      {p.pinned && (
                        <div className="mb-2 flex justify-center">
                          <Badge className="bg-amber-100 text-amber-700">
                            <Pin className="h-3 w-3 mr-1" /> Pinned
                          </Badge>
                        </div>
                      )}
                      <MessageBubble
                        mine={!!meId && p.authorId === meId}
                        user={(p as any).author}
                        fallbackUserId={p.authorId}
                        timestamp={new Date(p.createdAt).toLocaleString()}
                      >
                        {p.body}
                      </MessageBubble>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Card className="h-full overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 h-full overflow-y-auto pr-2">
                {g.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 text-sm py-1"
                  >
                    <UserIdentity
                      user={(m as any).user}
                      fallbackId={m.userId}
                      avatarClassName="size-7"
                      nameClassName="text-sm"
                      subtitle={
                        m.role === "OWNER"
                          ? "Owner"
                          : m.role === "ADMIN"
                            ? "Admin"
                            : "Member"
                      }
                      className="flex-1"
                    />
                    <Badge
                      variant="outline"
                      className={
                        m.role === "OWNER"
                          ? "bg-amber-100 text-amber-700"
                          : ""
                      }
                    >
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">{children}</CardContent>
      </Card>
    </div>
  );
}
