import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const allowed = (process.env.ADMIN_EMAILS ?? '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (!email || !allowed.includes(email)) return null;
  return session;
}

export async function getAdminPartner() {
  const session = await auth();
  const user = session?.user?.email ? await db.user.findUnique({ where: { email: session.user.email.toLowerCase() } }) : null;
  if (!user) throw new Error('Create an ADMIN user before adding content.');
  const partner = await db.partner.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, businessName: 'KainchiDarshan', category: 'STAY', verificationStatus: 'VERIFIED' } });
  return partner;
}
