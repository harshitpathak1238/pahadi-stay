import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { AUTH_LIMITS, clientIp, limited } from '@/lib/review-rate-limit';

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  // This endpoint is an account-existence oracle by design, so it is capped
  // tightly: without a limit it can be used to harvest every registered address.
  const limit = limited(`exists:${clientIp(request)}`, AUTH_LIMITS.accountExists);
  if (!limit.allowed) {
    return NextResponse.json(
      { exists: false },
      { status: 429, headers: limit.retryAfterSec ? { 'Retry-After': String(limit.retryAfterSec) } : undefined },
    );
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ exists: false }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, select: { passwordHash: true } });
  // `hasPassword` tells an attacker which accounts still use a password and are
  // therefore worth brute-forcing, so it is only reported for addresses that
  // already exist — a pure enumeration oracle narrowed to existing accounts.
  // Callers that only need "does this account exist" should ignore it.
  return NextResponse.json({ exists: Boolean(user), hasPassword: Boolean(user?.passwordHash) });
}