"use client";

import { Socket, io } from "socket.io-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:43817";

let socket: Socket | null = null;
let lastToken: string | null = null;

/**
 * Returns a singleton socket.io connection to the backend `/realtime`
 * namespace. The connection auto-authenticates with the JWT in
 * localStorage and auto-reconnects on transient failures.
 *
 * If the auth token changes (login/logout), the existing socket is
 * disconnected and re-created with the new token.
 */
export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("authToken");
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
      lastToken = null;
    }
    return null;
  }

  if (socket && lastToken === token && socket.connected) {
    return socket;
  }

  if (socket && lastToken !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io(`${API_BASE_URL}/realtime`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 10_000,
      timeout: 10_000,
      autoConnect: true,
    });
    lastToken = token;
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastToken = null;
  }
}

export type RoomKind = "discussion" | "group" | "ticket";

export interface RoomHandle {
  leave: () => void;
}

/**
 * Joins a room and returns a handle that lets the caller leave on cleanup.
 * Idempotent: re-calling with the same args is safe.
 */
export function joinRoom(kind: RoomKind, id: string): RoomHandle {
  const s = getSocket();
  if (!s) return { leave: () => undefined };
  const send = () => s.emit("room:join", { kind, id });
  if (s.connected) send();
  s.on("connect", send);
  return {
    leave: () => {
      s.off("connect", send);
      try {
        s.emit("room:leave", { kind, id });
      } catch {
        /* noop */
      }
    },
  };
}
