import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const adminEmails = () => (process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);

export function isAllowedAdminEmail(email?: string | null) {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export function isAllowedAdminRole(role?: string | null) {
  return ['OWNER', 'STAFF', 'ADMIN'].includes(role ?? '');
}

export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  const user = await db.user.findUnique({ where: { email }, select: { role: true } });
  if (!user || !isAllowedAdminRole(user.role)) return null;
  if (user.role === 'ADMIN' && !isAllowedAdminEmail(email)) return null;
  return session;
}

export async function getAdminPartner() {
  const session = await auth();
  const user = session?.user?.email ? await db.user.findUnique({ where: { email: session.user.email.toLowerCase() } }) : null;
  if (!user) throw new Error('Create an admin user before adding content.');
  return db.partner.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, businessName: 'Pahadi Stay', category: 'STAY', verificationStatus: 'VERIFIED' } });
}
