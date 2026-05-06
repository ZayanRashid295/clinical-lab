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
import { Bell, BellOff, Check, CheckCheck, Trash2, Loader2 } from "lucide-react";
import {
  launchNotificationsService,
  type AppNotification,
} from "@/app/services/launch";

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

  const onMarkAll = async () => {
    setActing(true);
    try {
      await launchNotificationsService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setActing(false);
    }
  };

  const onMark = async (id: string) => {
    await launchNotificationsService.markAsRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const onDelete = async (id: string) => {
    await launchNotificationsService.remove(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const onClick = (n: AppNotification) => {
    if (!n.isRead) onMark(n.id).catch(() => undefined);
    const data: any = n.data || {};
    if (n.type === "DISCUSSION_REPLY" && data.discussionId) {
      router.push(`/discussions/${data.discussionId}`);
    } else if (n.type === "STUDY_GROUP_POST" && data.groupId) {
      router.push(`/study-groups/${data.groupId}`);
    } else if (n.type === "FEEDBACK_REPLY" && data.ticketId) {
      router.push(`/feedback/${data.ticketId}`);
    } else if (n.type === "MOCK_EXAM_RESULT") {
      router.push(`/mock-exams`);
    } else if (n.type === "GOAL_COMPLETED" || n.type === "GOAL_PROGRESS") {
      router.push(`/goals`);
    } else if (n.type === "ACHIEVEMENT_UNLOCKED" || n.type === "STREAK_MILESTONE") {
      router.push(`/achievements`);
    }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="text-emerald-600" /> Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay on top of replies, achievements and study reminders.
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

      <Card>
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
              <p className="font-medium">You're all caught up.</p>
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
                    <div
                      className={`mt-1.5 w-2.5 h-2.5 rounded-full ${
                        n.isRead ? "bg-transparent" : "bg-emerald-500"
                      }`}
                    />
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
                      <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">
                        {n.message}
                      </p>
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
    </div>
  );
}
