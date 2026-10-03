import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { AUTH_LIMITS, ReviewRateLimiter, clientIp, limited, rateLimit } from '@/lib/review-rate-limit';

describe('rateLimit', () => {
  it('allows requests up to the cap, then blocks', () => {
    const key = 'test:cap';
    expect(rateLimit(key, 3, 60_000, 1000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000, 2000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000, 3000).allowed).toBe(true);
    const blocked = rateLimit(key, 3, 60_000, 4000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('does not block until the window has rolled over', () => {
    const key = 'test:window';
    expect(rateLimit(key, 1, 10_000, 0).allowed).toBe(true);
    expect(rateLimit(key, 1, 10_000, 5_000).allowed).toBe(false);
    // Past the window the old hit is pruned and the caller is allowed again.
    expect(rateLimit(key, 1, 10_000, 11_000).allowed).toBe(true);
  });

  it('keys buckets independently so one IP cannot lock out another', () => {
    expect(rateLimit('test:a', 1, 60_000, 1000).allowed).toBe(true);
    expect(rateLimit('test:a', 1, 60_000, 2000).allowed).toBe(false);
    expect(rateLimit('test:b', 1, 60_000, 2000).allowed).toBe(true);
  });
});

describe('clientIp', () => {
  const withHeaders = (headers: Record<string, string>) => new Request('http://x/', { headers });

  it('prefers the platform-provided real IP over the spoofable forwarded chain', () => {
    expect(clientIp(withHeaders({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' }))).toBe('1.1.1.1');
  });

  it('takes the first hop of x-forwarded-for when no real IP is present', () => {
    expect(clientIp(withHeaders({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8' }))).toBe('9.9.9.9');
  });

  it('falls back to a constant rather than throwing', () => {
    expect(clientIp(withHeaders({}))).toBe('unknown');
  });

  it('reads NextAuth-style plain header records, not just Headers', () => {
    // The credentials callback hands over a plain object, not a `Request`.
    expect(clientIp({ headers: { 'x-forwarded-for': '4.4.4.4, 3.3.3.3' } })).toBe('4.4.4.4');
    expect(clientIp({ headers: { 'x-real-ip': '5.5.5.5', 'x-forwarded-for': '6.6.6.6' } })).toBe('5.5.5.5');
  });

  it('tolerates a repeated header arriving as an array', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': ['7.7.7.7', '8.8.8.8'] } })).toBe('7.7.7.7');
  });
});

describe('AUTH_LIMITS', () => {
  it('throttles password guessing harder than general browsing', () => {
    expect(AUTH_LIMITS.login.max).toBeLessThanOrEqual(10);
    expect(AUTH_LIMITS.login.windowMs).toBeGreaterThanOrEqual(15 * 60 * 1000);
  });

  it('throttles email-sending endpoints to a handful per hour', () => {
    expect(AUTH_LIMITS.forgotPassword.max).toBeLessThanOrEqual(5);
    expect(AUTH_LIMITS.signup.max).toBeLessThanOrEqual(5);
  });
});

describe('ReviewRateLimiter', () => {
  let limiter: ReviewRateLimiter;
  beforeEach(() => {
    limiter = new ReviewRateLimiter();
    limiter.reset();
  });

  it('keeps its original policy of 3 per rolling window', () => {
    expect(limiter.check('1.2.3.4', 1000).allowed).toBe(true);
    expect(limiter.check('1.2.3.4', 2000).allowed).toBe(true);
    expect(limiter.check('1.2.3.4', 3000).allowed).toBe(true);
    expect(limiter.check('1.2.3.4', 4000).allowed).toBe(false);
  });

  it('reset clears stored hits', () => {
    limiter.check('5.6.7.8', 1000);
    limiter.reset();
    expect(limiter.check('5.6.7.8', 2000).allowed).toBe(true);
  });
});

/**
 * Source-level guards.
 *
 * These regressions were live vulnerabilities, so the fix is pinned with a test
 * that fails if the dangerous shape is ever reintroduced.
 */
describe('authorization regressions', () => {
  const read = (relative: string) => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

  it('never trusts a client-supplied admin flag', () => {
    // Previously `!body.admin` let any caller skip the ownership check.
    const source = read('app/api/trips/[id]/bookings/[bookingId]/route.ts');
    expect(source).not.toMatch(/body\.admin/);
    expect(source).toMatch(/requireAdmin/);
  });

  it('rejects anonymous callers by default instead of only checking logged-in ones', () => {
    // The old guard was `if (session?.user?.email && ...)`, which short-circuits
    // to "allow" when there is no session at all.
    const source = read('app/api/trips/[id]/bookings/[bookingId]/route.ts');
    expect(source).not.toMatch(/if \(session\?\.user\?\.email &&/);
    expect(source).toMatch(/if \(!isAdmin && !ownsBySession && !ownsByToken\)/);
  });

  it('guards every admin handler with requireAdmin', () => {
    // middleware.ts excludes /api from its matcher, so each handler must guard
    // itself; `vehicle-types/[id]` shipped with no guard at all.
    const source = read('app/api/admin/vehicle-types/[id]/route.ts');
    const handlers = source.match(/export async function (PATCH|DELETE)/g) ?? [];
    expect(handlers.length).toBeGreaterThan(0);
    expect(source.match(/requireAdmin\(\)/g) ?? []).toHaveLength(handlers.length);
  });

  it('rate-limits every unauthenticated auth endpoint', () => {
    for (const route of [
      'app/api/auth/signup/route.ts',
      'app/api/auth/forgot-password/route.ts',
      'app/api/auth/reset-password/route.ts',
      'app/api/auth/account-exists/route.ts',
    ]) {
      expect(read(route), route).toMatch(/limited\(/);
    }
    expect(read('lib/auth.ts')).toMatch(/limited\(/);
  });

  it('never ships the guest cancel token to the browser', () => {
    for (const route of [
      'app/api/admin/orders/[id]/route.ts',
      'app/api/admin/overview/route.ts',
      'app/api/account/bookings/route.ts',
      'app/admin/orders/[id]/page.tsx',
    ]) {
      expect(read(route), route).toMatch(/cancelToken: true/);
    }
  });
});