import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const schema = z.object({ email: z.string().email() });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: 'If an account exists, reset instructions will be sent.' });
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (user) { const token = randomBytes(32).toString('hex'); await db.passwordResetToken.deleteMany({ where: { userId: user.id } }); await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 30 * 60 * 1000) } }); const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`; if (process.env.RESEND_API_KEY) await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM ?? 'Pahadi Stay <onboarding@resend.dev>', to: [user.email], subject: 'Reset your Pahadi Stay password', html: `<p>We received a password reset request for your Pahadi Stay account.</p><p><a href="${resetUrl}">Choose a new password</a></p><p>This link expires in 30 minutes. If you did not request it, you can ignore this email.</p>` }) }); }
  return NextResponse.json({ message: 'If an account exists, reset instructions will be sent.' });
}
