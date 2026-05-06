/**
 * Tiny browser-side event bus so any component can react to a freshly
 * pushed notification (delivered via SSE in NotificationBell).
 *
 * Usage:
 *   useEffect(() => {
 *     return onNotification((n) => { if (n.data?.ticketId === id) reload(); });
 *   }, [id]);
 */

export type NotificationLike = {
  id: string;
  type?: string;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  isRead?: boolean;
  createdAt?: string;
};

const EVENT_NAME = "app:notification";

export function emitNotification(n: NotificationLike): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NotificationLike>(EVENT_NAME, { detail: n }));
}

export function onNotification(
  handler: (n: NotificationLike) => void
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const wrapped = (e: Event) => {
    const ce = e as CustomEvent<NotificationLike>;
    if (ce?.detail) handler(ce.detail);
  };
  window.addEventListener(EVENT_NAME, wrapped);
  return () => window.removeEventListener(EVENT_NAME, wrapped);
}
