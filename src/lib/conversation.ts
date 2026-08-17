const STORAGE_KEY = "oplis_conversation_id";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;

/** Повертає conversationId поточної сесії чату, створюючи його за потреби. */
export function ensureConversationId(): string {
  if (typeof window === "undefined") return createId();
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const next = createId();
    window.sessionStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return createId();
  }
}

/** Створює новий conversationId (новий чат). */
export function resetConversationId(): string {
  const next = createId();
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }
  return next;
}
