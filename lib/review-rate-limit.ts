// Minimal in-memory spam guard for the public review form (no new dependency).
// Max 3 submissions per IP per rolling 24h. For a single-instance Next.js
// server this is enough; move to a shared store if the app ever scales out.
export class ReviewRateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit = 3,
    private readonly windowMs = 24 * 60 * 60 * 1000,
  ) {}

  check(key: string, now = Date.now()): { allowed: boolean; retryAfterSec?: number } {
    const recent = (this.hits.get(key) ?? []).filter((stamp) => now - stamp < this.windowMs);
    if (recent.length >= this.limit) {
      const oldest = Math.min(...recent);
      return { allowed: false, retryAfterSec: Math.ceil((oldest + this.windowMs - now) / 1000) };
    }
    recent.push(now);
    this.hits.set(key, recent);
    return { allowed: true };
  }

  reset() {
    this.hits.clear();
  }
}

export const publicReviewLimiter = new ReviewRateLimiter();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}
