"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { useRouter } from "next/router";
import {
  emitNotification,
  launchNotificationsService,
  type AppNotification,
} from "@/app/services/launch";
import { getSocket } from "@/app/services/realtime/socket";

const POLL_MS = 30_000;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:43817";

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const sec = Math.max(1, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  const day = Math.round(h / 24);
  return `${day}d`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchCount = async () => {
    try {
      const r = await launchNotificationsService.unreadCount();
      setUnread(r.count);
    } catch {
      // swallow — auth may not be ready yet
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const list = await launchNotificationsService.listMine({ take: 20 });
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Transport priority: WebSocket (socket.io) -> SSE -> polling
    let pollId: number | undefined;
    let es: EventSource | undefined;

    const startPolling = () => {
      if (pollId !== undefined) return;
      pollId = window.setInterval(fetchCount, POLL_MS) as unknown as number;
    };

    const onIncoming = (n: any) => {
      if (!n?.id) return;
      setItems((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        return [n, ...prev].slice(0, 50);
      });
      setUnread((u) => u + (n.isRead ? 0 : 1));
      emitNotification(n);
    };

    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    const socket = token ? getSocket() : null;
    let usingSocket = false;
    let sseStarted = false;

    const startSse = () => {
      if (sseStarted || !token || typeof window === "undefined") return;
      if (!("EventSource" in window)) {
        startPolling();
        return;
      }
      sseStarted = true;
      try {
        es = new EventSource(
          `${API_BASE_URL}/notifications/me/stream?token=${encodeURIComponent(token)}`
        );
        es.addEventListener("notification", (evt) => {
          try {
            const payload = JSON.parse((evt as MessageEvent).data);
            onIncoming(payload?.data ?? payload);
          } catch {
            // ignore malformed payloads
          }
        });
        es.onerror = () => {
          es?.close();
          es = undefined;
          startPolling();
        };
      } catch {
        startPolling();
      }
    };

    if (socket) {
      const onNotif = (n: any) => onIncoming(n);
      const onConnect = () => {
        usingSocket = true;
        if (es) {
          es.close();
          es = undefined;
        }
        if (pollId !== undefined) {
          clearInterval(pollId);
          pollId = undefined;
        }
      };
      const onDisconnect = () => {
        usingSocket = false;
        // Fall back while disconnected; socket will reconnect automatically.
        startSse();
      };

      socket.on("notification", onNotif);
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      if (socket.connected) onConnect();
      // If socket fails to connect within 4s, lean on SSE/polling.
      const fallbackTimer = window.setTimeout(() => {
        if (!usingSocket) startSse();
      }, 4000);

      return () => {
        socket.off("notification", onNotif);
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        clearTimeout(fallbackTimer);
        if (pollId !== undefined) clearInterval(pollId);
        es?.close();
      };
    }

    // No auth or no socket support: SSE + polling fallback
    startSse();
    return () => {
      if (pollId !== undefined) clearInterval(pollId);
      es?.close();
    };
  }, []);

  useEffect(() => {
    if (open) fetchList();
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const onMarkRead = async (id: string) => {
    try {
      await launchNotificationsService.markAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      // ignore
    }
  };

  const onMarkAll = async () => {
    try {
      await launchNotificationsService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  const onDelete = async (id: string) => {
    try {
      await launchNotificationsService.remove(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  const onItemClick = async (n: AppNotification) => {
    if (!n.isRead) onMarkRead(n.id);
    const data: any = n.data || {};
    const target = (() => {
      switch (n.type) {
        case "DISCUSSION_REPLY":
        case "DISCUSSION_UPVOTE":
        case "DISCUSSION_CREATED":
          return data.discussionId
            ? `/discussions/${data.discussionId}`
            : "/discussions";
        case "STUDY_GROUP_POST":
        case "STUDY_GROUP_JOIN":
          return data.groupId ? `/study-groups/${data.groupId}` : "/study-groups";
        case "FEEDBACK_REPLY":
        case "FEEDBACK_TICKET_CREATED":
        case "FEEDBACK_USER_REPLY":
          return data.ticketId ? `/feedback/${data.ticketId}` : "/feedback";
        case "QUESTION_REPORT_UPDATE":
        case "QUESTION_REPORT_CREATED":
          return "/my-reports";
        case "MOCK_EXAM_RESULT":
        case "MOCK_EXAM_PUBLISHED":
          return "/mock-exams";
        case "GOAL_COMPLETED":
        case "GOAL_PROGRESS":
        case "GOAL_DUE":
          return "/goals";
        case "ACHIEVEMENT_UNLOCKED":
        case "STREAK_MILESTONE":
        case "STREAK_RISK":
          return "/achievements";
        case "SUBSCRIPTION_EXPIRING":
        case "SUBSCRIPTION_EXPIRED":
        case "SUBSCRIPTION_RENEWED":
          return "/subscriptions";
        case "WELCOME":
          return data.route || "/study";
        default:
          return null;
      }
    })();
    if (target) router.push(target);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 inline-flex items-center justify-center rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900 transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} className="sm:w-5 sm:h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 rounded-full bg-rose-600 text-white text-[10px] leading-none min-w-[18px] h-[18px] px-1 flex items-center justify-center font-semibold shadow-sm ring-2 ring-white dark:ring-slate-950">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(420px,calc(100vw-1rem))] bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
              {unread > 0 && (
                <p className="text-xs text-muted-foreground">
                  {unread} unread
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={onMarkAll}
                  className="text-xs font-medium text-teal-700 dark:text-teal-300 hover:underline px-2 py-1"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Bell className="mx-auto mb-2 text-slate-300 dark:text-slate-700" size={26} />
                You&apos;re all caught up.
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`group px-4 py-3 cursor-pointer transition-colors ${
                    n.isRead
                      ? "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      : "bg-teal-50/60 dark:bg-teal-900/15 hover:bg-teal-50 dark:hover:bg-teal-900/25"
                  }`}
                  onClick={() => onItemClick(n)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1 w-2 h-2 rounded-full bg-teal-500"
                      style={{ visibility: n.isRead ? "hidden" : "visible" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                        {n.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(n.id);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                          title="Mark read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(n.id);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => {
              router.push("/notifications");
              setOpen(false);
            }}
            className="w-full text-center py-2.5 text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-slate-50 dark:hover:bg-slate-900 border-t border-slate-100 dark:border-slate-800"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
