import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';

const signupSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email(), password: z.string().min(8).max(72) });
export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please enter a valid name, email, and password.' }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'An account already exists with this email. Sign in or reset your password.' }, { status: 409 });
  const user = await db.user.upsert({ where: { email }, update: { name: parsed.data.name, passwordHash: await hash(parsed.data.password, 12) }, create: { email, name: parsed.data.name, passwordHash: await hash(parsed.data.password, 12) } });
  return NextResponse.json({ id: user.id, email: user.email });
}
