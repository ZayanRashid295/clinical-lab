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
import { Badge } from "@/shared/ui/badge";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  MessageSquare,
  Users,
  LifeBuoy,
  Flag,
  Sparkles,
  Target,
  Trophy,
  CreditCard,
  ShieldAlert,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import {
  launchNotificationsService,
  type AppNotification,
} from "@/app/services/launch";
import { useToast } from "@/shared/ui/use-toast";
import { toastApiError } from "@/app/services/base/api-http-error";
import { useRealtimeEvent } from "@/app/services/realtime/use-realtime-room";
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent";
import { getNotificationRoute } from "@/lib/notifications/notification-routes";

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const sec = Math.max(1, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.round(h / 24);
  return `${day}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [acting, setActing] = useState(false);

  const load = async (unreadOnly = false) => {
    setLoading(true);
    try {
      const list = await launchNotificationsService.listMine({
        unreadOnly,
        take: 100,
      });
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter === "unread");
  }, [filter]);

  // Live updates from socket.io (notifications are emitted to user room)
  useRealtimeEvent<AppNotification>("notification", (n) => {
    if (!n?.id) return;
    // If we're filtering unread-only and this arrives as read, ignore.
    if (filter === "unread" && n.isRead) return;
    setItems((prev) => {
      if (prev.some((x) => x.id === n.id)) return prev;
      return [n, ...prev].slice(0, 200);
    });
  });

  const onMarkAll = async () => {
    setActing(true);
    try {
      await launchNotificationsService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      toastApiError(toast, e, "Couldn’t mark all read");
    } finally {
      setActing(false);
    }
  };

  const onMark = async (id: string) => {
    try {
      await launchNotificationsService.markAsRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      toastApiError(toast, e, "Couldn’t update notification");
    }
  };

  const onDelete = async (id: string) => {
    try {
      await launchNotificationsService.remove(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      toastApiError(toast, e, "Couldn’t remove notification");
    }
  };

  const onClick = (n: AppNotification) => {
    if (!n.isRead) onMark(n.id).catch(() => undefined);
    const target = getNotificationRoute(n);
    if (target) router.push(target);
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="px-4 sm:px-6 lg:px-10 pb-10 pt-6 space-y-4 w-full max-w-none">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="text-emerald-600" /> Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Faculty assignments, messages, achievements, and study reminders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread {unread > 0 && <Badge variant="secondary" className="ml-2">{unread}</Badge>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAll}
            disabled={acting || unread === 0}
          >
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base">Inbox</CardTitle>
          </CardHeader>
          <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BellOff className="mx-auto mb-3 text-gray-300" size={36} />
              <p className="font-medium">You&apos;re all caught up.</p>
              <p className="text-xs">New notifications will appear here.</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onClick(n)}
                  className={`group p-4 cursor-pointer transition-colors ${
                    n.isRead
                      ? "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      : "bg-emerald-50/40 dark:bg-emerald-900/10 hover:bg-emerald-100/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div
                        className={
                          "w-9 h-9 rounded-lg flex items-center justify-center border " +
                          (n.isRead
                            ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                            : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800")
                        }
                      >
                        {(() => {
                          const t = n.type;
                          const cls = "h-4 w-4";
                          if (t.startsWith("DISCUSSION")) return <MessageSquare className={cls} />;
                          if (t.startsWith("STUDY_GROUP")) return <Users className={cls} />;
                          if (t.startsWith("FEEDBACK")) return <LifeBuoy className={cls} />;
                          if (t.startsWith("QUESTION_REPORT")) return <Flag className={cls} />;
                          if (t.startsWith("ACHIEVEMENT") || t.startsWith("STREAK"))
                            return <Trophy className={cls} />;
                          if (t.startsWith("GOAL")) return <Target className={cls} />;
                          if (t.startsWith("SUBSCRIPTION")) return <CreditCard className={cls} />;
                          if (t === "FACULTY_MESSAGE") return <GraduationCap className={cls} />;
                          if (t === "ASSIGNMENT_PUBLISHED" || t === "ASSIGNMENT_DUE")
                            return <ClipboardList className={cls} />;
                          if (t.includes("SECURITY")) return <ShieldAlert className={cls} />;
                          return <Sparkles className={cls} />;
                        })()}
                      </div>
                      {!n.isRead ? (
                        <div className="mt-2 flex justify-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-foreground">
                          {n.title}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            {n.type.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        <MarkdownContent variant="muted">{n.message}</MarkdownContent>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMark(n.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(n.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unread</span>
                <span className="font-semibold">{unread}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total loaded</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="pt-2 border-t text-xs text-muted-foreground">
                Updates arrive live in real time via WebSocket.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
