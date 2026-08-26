import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';

const schema = z.object({ token: z.string().min(20), password: z.string().min(8).max(72) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid reset token and a password of at least 8 characters.' }, { status: 400 });
  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const reset = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 400 });
  await db.$transaction([db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hash(parsed.data.password, 12) } }), db.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } })]);
  return NextResponse.json({ message: 'Your password has been updated.' });
}
