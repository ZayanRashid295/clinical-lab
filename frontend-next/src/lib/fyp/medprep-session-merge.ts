/**
 * Shared MedPrep session helpers (Practice / Learning / Evaluation / Shadow).
 * Keeps `conversationId` stable when child components merge partial session updates.
 */
export type SessionWithConversationId = { conversationId?: string }

export function trimMedprepConversationIdQuery(q: unknown): string {
  return typeof q === "string" ? q.trim() : ""
}

/** Prefer incoming id, then previous, then URL query (resume links). */
export function mergeSessionConversationId<T extends SessionWithConversationId>(
  incoming: T,
  prev: T | null | undefined,
  conversationIdFromQuery: string,
): T {
  const cid =
    (incoming.conversationId && String(incoming.conversationId).trim()) ||
    (prev?.conversationId && String(prev.conversationId).trim()) ||
    trimMedprepConversationIdQuery(conversationIdFromQuery)
  return cid ? { ...incoming, conversationId: cid } : { ...incoming }
}
