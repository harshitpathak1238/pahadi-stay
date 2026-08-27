import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const profileSchema = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().min(10).max(20).or(z.literal('')) });
const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(72) });

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } });
  return user ? NextResponse.json(user) : NextResponse.json({ error: 'Account not found.' }, { status: 404 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const body = await request.json();
  if (body.currentPassword || body.newPassword) {
    const parsedPassword = passwordSchema.safeParse(body);
    if (!parsedPassword.success) return NextResponse.json({ error: 'Enter your current password and a new password of at least 8 characters.' }, { status: 400 });
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user?.passwordHash) return NextResponse.json({ error: 'Google accounts cannot change password here.' }, { status: 400 });
    const { compare } = await import('bcryptjs');
    if (!(await compare(parsedPassword.data.currentPassword, user.passwordHash))) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hash(parsedPassword.data.newPassword, 12) } });
    return NextResponse.json({ message: 'Password updated.' });
  }
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid name and phone number.' }, { status: 400 });
  const user = await db.user.update({ where: { email: session.user.email }, data: { name: parsed.data.name, phone: parsed.data.phone || null }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } });
  return NextResponse.json(user);
}
