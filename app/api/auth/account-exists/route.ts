import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ exists: false }, { status: 400 });

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, select: { passwordHash: true } });
  return NextResponse.json({ exists: Boolean(user), hasPassword: Boolean(user?.passwordHash) });
}