import NextAuth, { getServerSession } from 'next-auth';
import type { Account, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from './db';

const adminEmails = () => (process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);

const credentialsProvider = CredentialsProvider({
  name: 'Email',
  credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
  async authorize(credentials) {
    if (!credentials?.email || !credentials.password) return null;
    const user = await db.user.findUnique({ where: { email: credentials.email.toLowerCase() } });
    if (!user?.passwordHash || !(await compare(credentials.password, user.passwordHash))) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  },
});

const googleProvider = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }) : null;

export const authOptions = {
  providers: googleProvider ? [googleProvider, credentialsProvider] : [credentialsProvider],
  session: { strategy: 'jwt' as const },
  callbacks: {
    async signIn({ user, account }: { user: User; account: Account | null }) {
      if (account?.provider === 'google' && user.email) {
        const email = user.email.toLowerCase();
        const isConfiguredAdmin = adminEmails().includes(email);
        await db.user.upsert({ where: { email }, update: { name: user.name, ...(isConfiguredAdmin ? { role: 'OWNER' } : {}) }, create: { email, name: user.name, role: isConfiguredAdmin ? 'OWNER' : 'CUSTOMER' } });
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user?.role) token.role = user.role;
      if (token.email && !token.role) {
        const record = await db.user.findUnique({ where: { email: String(token.email) }, select: { role: true } });
        if (record) token.role = record.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
};

export const auth = () => getServerSession(authOptions);
export const nextAuthHandler = NextAuth(authOptions);
