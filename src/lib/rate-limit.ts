/**
 * Simple in-memory rate limiter, keyed per client IP per route. Suitable
 * for a single persistent Node process (this app runs on cPanel/Node, not
 * serverless functions spread across instances) — if this app ever moves
 * to a multi-instance/serverless deployment, this in-memory approach would
 * need to move to a shared store (e.g. Redis) instead, since each instance
 * would otherwise track its own separate counts.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

// Periodically sweep expired buckets so long-running processes don't
// accumulate an ever-growing map of stale IPs.
let requestsSinceCleanup = 0;
const CLEANUP_INTERVAL_REQUESTS = 500;

function cleanupExpiredBuckets() {
  const now = Date.now();

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  requestsSinceCleanup += 1;

  if (requestsSinceCleanup >= CLEANUP_INTERVAL_REQUESTS) {
    requestsSinceCleanup = 0;
    cleanupExpiredBuckets();
  }

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Best-effort client IP extraction for a server sitting behind a reverse proxy. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp;
  }

  return "unknown";
}
