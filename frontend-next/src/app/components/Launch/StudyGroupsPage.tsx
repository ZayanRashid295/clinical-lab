"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ArrowRightLeft,
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
  Trash2,
} from "lucide-react";
import {
  studyGroupsService,
  onNotification,
  type StudyGroup,
  type StudyGroupDetail,
  type StudyGroupPost,
  type CreateStudyGroupPayload,
} from "@/app/services/launch";
import { useRealtimeRoom } from "@/app/services/realtime/use-realtime-room";
import { UserIdentity } from "@/shared/components/Common/UserIdentity";
import { MessageBubble } from "@/shared/components/Common/MessageBubble";
import { authService } from "@/shared";
import { Separator } from "@/shared/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useToast } from "@/shared/ui/use-toast";
import { toastApiError } from "@/app/services/base/api-http-error";
import { cn } from "@/shared/utils/cn";
import {
  APP_GLASS_CARD,
  APP_PAGE_PADDING,
  APP_PAGE_SHELL,
} from "@/app/config/app-shell";

function formatPostTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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
  const { toast } = useToast();
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await studyGroupsService.list({
        mineOnly: tab === "mine",
      });
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

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
    } catch (e) {
      toastApiError(toast, e, "Couldn’t create group");
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
    } catch (e) {
      toastApiError(toast, e, "Couldn’t join with that code");
    } finally {
      setJoining(false);
    }
  };

  const onJoin = async (g: StudyGroup) => {
    try {
      await studyGroupsService.join(g.id);
      router.push(`/study-groups/${g.id}`);
    } catch (e) {
      toastApiError(toast, e, "Couldn’t join group");
    }
  };

  return (
    <div
      className={cn(
        APP_PAGE_SHELL,
        APP_PAGE_PADDING,
        "space-y-4 w-full max-w-none"
      )}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Users className="text-teal-600 dark:text-teal-400" /> Study Groups
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
        <Card className={cn(APP_GLASS_CARD)}>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Users
              className="mx-auto mb-3 text-gray-300 dark:text-slate-600"
              size={42}
            />
            <p className="font-medium">No groups yet.</p>
            <p className="text-xs">Create one or join with an invite code.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((g) => (
            <Card
              key={g.id}
              className={cn(
                APP_GLASS_CARD,
                "hover:shadow-md transition-shadow flex flex-col"
              )}
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
  const { toast } = useToast();
  const [g, setG] = useState<StudyGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState("");
  const [posting, setPosting] = useState(false);
  const meId = authService.getCurrentUser?.()?.id as string | undefined;
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferToId, setTransferToId] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const iAmOwner = useMemo(() => {
    if (!g || !meId) return false;
    if (g.ownerId === meId) return true;
    return g.members.some((m) => m.userId === meId && m.role === "OWNER");
  }, [g, meId]);

  const transferCandidates = useMemo(() => {
    if (!g || !meId) return [];
    return g.members.filter((m) => m.userId !== meId);
  }, [g, meId]);

  const { pinnedPosts, threadPosts } = useMemo(() => {
    if (!g?.posts?.length) {
      return { pinnedPosts: [] as StudyGroupPost[], threadPosts: [] as StudyGroupPost[] };
    }
    const byTime = (a: StudyGroupPost, b: StudyGroupPost) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    const pinned = g.posts.filter((p) => p.pinned).sort(byTime);
    const unpinned = g.posts.filter((p) => !p.pinned).sort(byTime);
    return { pinnedPosts: pinned, threadPosts: unpinned };
  }, [g?.posts]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [g?.posts, id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setG(await studyGroupsService.findOne(id));
    } catch {
      setG(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Live refresh on relevant push (e.g. another member posts)
  useEffect(() => {
    return onNotification((n) => {
      const gid = (n.data as any)?.groupId;
      if (gid && gid === id) load();
    });
  }, [id, load]);

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
    "group:ownership:transferred": () => load(),
  });

  const onPost = async () => {
    if (!post.trim()) return;
    setPosting(true);
    try {
      await studyGroupsService.createPost(id, { body: post });
      setPost("");
      await load();
    } catch (e) {
      toastApiError(toast, e, "Couldn’t send message");
    } finally {
      setPosting(false);
    }
  };

  const onLeave = async () => {
    setLeaving(true);
    try {
      await studyGroupsService.leave(id);
      setLeaveOpen(false);
      await router.push("/study-groups");
    } catch (e) {
      toastApiError(toast, e, "Couldn’t leave group");
    } finally {
      setLeaving(false);
    }
  };

  const onTransferOwnership = async () => {
    if (!transferToId) return;
    setTransferring(true);
    try {
      await studyGroupsService.transferOwnership(id, transferToId);
      setTransferOpen(false);
      setTransferToId("");
      toast({
        title: "Ownership transferred",
        description: "You are now a regular member. You can leave the group whenever you like.",
      });
      await load();
    } catch (e) {
      toastApiError(toast, e, "Couldn’t transfer ownership");
    } finally {
      setTransferring(false);
    }
  };

  const onDeleteGroup = async () => {
    setDeleting(true);
    try {
      await studyGroupsService.remove(id);
      setDeleteOpen(false);
      toast({ title: "Group deleted" });
      await router.push("/study-groups");
    } catch (e) {
      toastApiError(toast, e, "Couldn’t delete group");
    } finally {
      setDeleting(false);
    }
  };

  const openTransferModal = () => {
    const first = transferCandidates[0]?.userId ?? "";
    setTransferToId(first);
    setTransferOpen(true);
  };

  return (
    <div
      className={cn(
        APP_PAGE_SHELL,
        "flex h-[calc(100dvh-80px)] w-full max-w-none flex-col overflow-hidden px-4 pb-4 pt-5 sm:px-6 lg:px-10"
      )}
    >
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/study-groups")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to groups
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : !g ? (
        <Card className={cn(APP_GLASS_CARD, "max-w-lg")}>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Group not found or you don&apos;t have access.
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div
            className={cn(
              APP_GLASS_CARD,
              "flex shrink-0 flex-wrap items-start justify-between gap-4 rounded-xl bg-white/95 px-4 py-3 dark:bg-white/5"
            )}
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl text-white ${g.color}`}
              >
                {g.icon}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {g.isPrivate ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  ) : null}
                  <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
                    {g.name}
                  </h1>
                  <Badge variant="secondary" className="font-normal">
                    {g.category}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {g.description || "No description"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                </p>
                {g.isPrivate && g.inviteCode ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 font-mono text-xs dark:bg-white/10 dark:text-slate-200">
                    <Hash className="h-3 w-3" />
                    {g.inviteCode}
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(g.inviteCode!);
                      }}
                      className="hover:text-emerald-600"
                      title="Copy invite code"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex max-w-md shrink-0 flex-col items-end gap-2 sm:max-w-lg">
              {iAmOwner ? (
                <>
                  <p className="text-right text-xs leading-snug text-muted-foreground">
                    As owner, transfer ownership to another member or delete the group
                    before you can leave.
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openTransferModal}
                      className="gap-2"
                      disabled={transferCandidates.length === 0}
                      title={
                        transferCandidates.length === 0
                          ? "Add another member first"
                          : undefined
                      }
                    >
                      <ArrowRightLeft className="h-4 w-4" /> Transfer ownership
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                      className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" /> Delete group
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLeaveOpen(true)}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" /> Leave
                </Button>
              )}
            </div>
          </div>

          <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this group?</AlertDialogTitle>
                <AlertDialogDescription>
                  You’ll stop receiving new posts and notifications from{" "}
                  <span className="font-semibold">{g.name}</span>. You can re-join
                  later if the group is public (or via invite code if it’s
                  private).
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

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this group?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes{" "}
                  <span className="font-semibold">{g.name}</span> and all of its
                  messages for everyone. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteGroup}
                  disabled={deleting}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {deleting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                    </span>
                  ) : (
                    "Delete group"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {transferOpen ? (
            <ModalShell
              title="Transfer ownership"
              onClose={() => {
                setTransferOpen(false);
                setTransferToId("");
              }}
            >
              {transferCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Invite or add another member to this group first. Then you can
                  make them the owner and leave if you want.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    The selected member will become the owner and can manage the
                    group. You will stay in the group as a regular member.
                  </p>
                  <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                    New owner
                  </label>
                  <Select
                    value={transferToId}
                    onValueChange={setTransferToId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a member" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                      {transferCandidates.map((m) => {
                        const u = (m as any).user;
                        const label = u
                          ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
                            u.email ||
                            m.userId
                          : m.userId;
                        return (
                          <SelectItem key={m.userId} value={m.userId}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTransferOpen(false);
                    setTransferToId("");
                  }}
                  disabled={transferring}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void onTransferOwnership()}
                  disabled={
                    transferring ||
                    transferCandidates.length === 0 ||
                    !transferToId
                  }
                  className="gap-2"
                >
                  {transferring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="h-4 w-4" />
                  )}
                  Transfer
                </Button>
              </div>
            </ModalShell>
          ) : null}

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_260px] lg:gap-4">
            <div
              className={cn(
                APP_GLASS_CARD,
                "flex min-h-0 flex-col overflow-hidden rounded-xl bg-slate-50/60 shadow-sm dark:bg-white/[0.04]"
              )}
            >
              <div
                ref={scrollRef}
                className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4"
              >
                {pinnedPosts.length > 0 ? (
                  <div className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                      <Pin className="h-3.5 w-3.5" aria-hidden />
                      Pinned
                    </div>
                    <div className="space-y-4">
                      {pinnedPosts.map((p) => (
                        <MessageBubble
                          key={p.id}
                          mine={!!meId && p.authorId === meId}
                          user={(p as any).author}
                          fallbackUserId={p.authorId}
                          timestamp={formatPostTime(p.createdAt)}
                        >
                          {p.body}
                        </MessageBubble>
                      ))}
                    </div>
                  </div>
                ) : null}

                {threadPosts.length === 0 && pinnedPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      No messages yet
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      Say hello below—your group will see it here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {threadPosts.map((p) => (
                      <MessageBubble
                        key={p.id}
                        mine={!!meId && p.authorId === meId}
                        user={(p as any).author}
                        fallbackUserId={p.authorId}
                        timestamp={formatPostTime(p.createdAt)}
                      >
                        {p.body}
                      </MessageBubble>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="shrink-0 border-t border-slate-200/80 bg-white px-3 py-3 dark:border-white/10 dark:bg-white/[0.04] sm:px-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Textarea
                    placeholder="Message the group…"
                    rows={2}
                    value={post}
                    onChange={(e) => setPost(e.target.value)}
                    className="min-h-[44px] resize-none sm:min-h-[52px] sm:flex-1"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" || e.shiftKey) return;
                      e.preventDefault();
                      if (!post.trim() || posting) return;
                      void onPost();
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => void onPost()}
                    disabled={!post.trim() || posting}
                    className="h-10 shrink-0 gap-2 sm:self-stretch sm:px-6"
                  >
                    {posting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Post
                  </Button>
                </div>
                <p className="mt-2 hidden text-[11px] text-muted-foreground sm:block">
                  Enter to send · Shift+Enter for a new line
                </p>
              </div>
            </div>

            <Card
              className={cn(
                APP_GLASS_CARD,
                "flex max-h-[min(560px,70vh)] min-h-0 flex-col overflow-hidden lg:max-h-none lg:flex-1"
              )}
            >
              <CardHeader className="space-y-0 pb-2 pt-4">
                <CardTitle className="text-sm font-semibold">Members</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {g.members.length} in this group
                </p>
              </CardHeader>
              <CardContent className="flex-1 space-y-0 overflow-y-auto px-3 pb-4 pt-0 sm:px-6">
                {g.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800"
                  >
                    <UserIdentity
                      user={(m as any).user}
                      fallbackId={m.userId}
                      avatarClassName="size-8"
                      nameClassName="text-sm"
                      subtitle={
                        m.role === "OWNER"
                          ? "Owner"
                          : m.role === "ADMIN"
                            ? "Admin"
                            : "Member"
                      }
                      className="min-w-0 flex-1"
                    />
                    <Badge
                      variant="outline"
                      className={
                        m.role === "OWNER"
                          ? "shrink-0 border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                          : "shrink-0 text-muted-foreground"
                      }
                    >
                      {m.role === "OWNER"
                        ? "Owner"
                        : m.role === "ADMIN"
                          ? "Admin"
                          : "Member"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
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
      <Card className={cn(APP_GLASS_CARD, "w-full max-w-lg")}>
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
