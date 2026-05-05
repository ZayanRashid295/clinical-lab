"use client";

import { useEffect, useRef } from "react";
import { RoomKind, getSocket, joinRoom } from "./socket";

type Handlers = Record<string, (payload: any) => void>;

/**
 * React hook that joins a realtime room when the component mounts and
 * subscribes to a map of socket events. Leaves the room and unsubscribes
 * on unmount. Handlers are kept up to date via a ref so callers don't
 * have to memoise them.
 *
 * Usage:
 *   useRealtimeRoom("group", groupId, {
 *     "group:post:created": (p) => addPost(p.post),
 *     "group:member:joined": () => refetchMembers(),
 *   });
 */
export function useRealtimeRoom(
  kind: RoomKind | null | undefined,
  id: string | null | undefined,
  handlers: Handlers
) {
  const handlersRef = useRef<Handlers>(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!kind || !id) return;
    const socket = getSocket();
    if (!socket) return;

    const handle = joinRoom(kind, id);

    const eventNames = Object.keys(handlersRef.current);
    const wrappers: Record<string, (p: any) => void> = {};
    for (const name of eventNames) {
      wrappers[name] = (payload: any) => {
        const fn = handlersRef.current[name];
        if (fn) fn(payload);
      };
      socket.on(name, wrappers[name]);
    }

    return () => {
      for (const name of eventNames) {
        socket.off(name, wrappers[name]);
      }
      handle.leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id]);
}

/**
 * Subscribe to a single global event (one not tied to a room).
 * Useful for the user's own notification stream which is auto-joined.
 */
export function useRealtimeEvent<T = any>(
  event: string,
  handler: (payload: T) => void
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const wrapped = (payload: T) => handlerRef.current(payload);
    socket.on(event, wrapped);
    return () => {
      socket.off(event, wrapped);
    };
  }, [event]);
}
