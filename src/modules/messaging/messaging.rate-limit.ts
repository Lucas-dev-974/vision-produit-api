/** Fenêtre glissante simple en mémoire (par processus) pour limiter le spam WS. */
const buckets = new Map<string, number[]>();

export function checkMessagingWsRateLimit(
  userId: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  let arr = buckets.get(userId) ?? [];
  arr = arr.filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(userId, arr);
    return false;
  }
  arr.push(now);
  buckets.set(userId, arr);
  return true;
}
