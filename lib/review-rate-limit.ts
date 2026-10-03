// Shared in-memory rate limiter for the unauthenticated auth endpoints.
//
// Why this exists: signup, forgot-password and the NextAuth credentials
// callback were all reachable without any throttling. That allowed password
// brute-forcing, bulk account creation, and using forgot-password as an email
// bombing relay against the Resend account.
//
// Scope: per single Next.js instance, matching the existing review limiter.
// `lib/cache.ts` already provides a shared Redis with an in-memory fallback, so
// the same shape is used here. Promote to a shared store before scaling out.

export type RateLimitResult = { allowed: boolean; retryAfterSec?: number };

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

/** Drops expired timestamps so the map cannot grow without bound. */
function prune(bucket: Bucket, now: number, windowMs: number) {
  const live = bucket.hits.filter((stamp) => now - stamp < windowMs);
  bucket.hits = live;
  return live;
}

/**
 * Fixed-window limiter keyed by client IP.
 *
 * `max` requests per `windowMs`. Returns a retry hint so handlers can send a
 * correct `Retry-After` header instead of guessing.
 */
export function rateLimit(key: string, max: number, windowMs: number, now = Date.now()): RateLimitResult {
  const bucket = buckets.get(key) ?? { hits: [] };
  const live = prune(bucket, now, windowMs);
  if (live.length >= max) {
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((live[0] + windowMs - now) / 1000)) };
  }
  live.push(now);
  buckets.set(key, bucket);
  return { allowed: true };
}

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is client-controllable, so on a direct-to-internet
 * deployment a limiter keyed purely on it can be bypassed by spoofing the
 * header. It still raises the cost of naive bulk abuse, and the platform's own
 * `x-real-ip` is preferred when present.
 *
 * Accepts either a Fetch `Request` or NextAuth's `RequestInternal`, which is a
 * plain object carrying a `headers` record rather than a `Headers` instance.
 */
export function clientIp(request: { headers: unknown }): string {
  const headers = request.headers as { get?: (name: string) => string | null } & Record<string, unknown>;
  const read = (name: string): string => {
    if (typeof headers?.get === 'function') return headers.get(name) ?? '';
    const value = headers?.[name] ?? headers?.[name.toLowerCase()];
    return Array.isArray(value) ? String(value[0] ?? '') : typeof value === 'string' ? value : '';
  };
  const real = read('x-real-ip').trim();
  if (real) return real;
  const forwarded = read('x-forwarded-for').trim();
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return 'unknown';
}

/** Throttle policy per endpoint. Tuned for real humans, not bulk scripts. */
export const AUTH_LIMITS = {
  /** Password guessing against the credentials callback. */
  login: { max: 10, windowMs: 15 * 60 * 1000 },
  /** Account creation + a bcrypt hash per request (CPU burn). */
  signup: { max: 5, windowMs: 60 * 60 * 1000 },
  /** Each accepted request sends a real email via Resend. */
  forgotPassword: { max: 5, windowMs: 60 * 60 * 1000 },
  /** Token guessing on the reset endpoint. */
  resetPassword: { max: 10, windowMs: 60 * 60 * 1000 },
  /** Account-enumeration probe. */
  accountExists: { max: 30, windowMs: 60 * 60 * 1000 },
} as const;

export function limited(key: string, policy: { max: number; windowMs: number }): RateLimitResult {
  return rateLimit(key, policy.max, policy.windowMs);
}

/* ------------------------------------------------------------------ */
/* Backwards-compatible review limiter                                */
/* ------------------------------------------------------------------ */

/**
 * The public review form keeps its original class API and its original policy
 * (3 submissions per IP per rolling 24h). It is now a thin wrapper over the
 * shared limiter so reviews and auth use one mechanism.
 */
export class ReviewRateLimiter {
  constructor(
    private readonly limit = 3,
    private readonly windowMs = 24 * 60 * 60 * 1000,
  ) {}

  check(key: string, now = Date.now()): RateLimitResult {
    return rateLimit(`review:${key}`, this.limit, this.windowMs, now);
  }

  /** Test seam: clear every stored bucket. */
  reset() {
    for (const key of [...buckets.keys()]) if (key.startsWith('review:')) buckets.delete(key);
  }
}

export const publicReviewLimiter = new ReviewRateLimiter();

/** Kept as an alias so existing imports do not change. */
export const getClientIp = clientIp;
