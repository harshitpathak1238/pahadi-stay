import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) return NextResponse.next();
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email?.toLowerCase();
  const role = typeof token?.role === 'string' ? token.role : '';
  if (!email || !['OWNER', 'STAFF', 'ADMIN'].includes(role) || (role === 'ADMIN' && !adminEmails().includes(email))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

// Scoped to /admin only. The previous matcher ran this middleware (plus a
// `getToken` JWT decode and a header mutation) on EVERY route including `/`,
// which forced the edge function into the critical path of the home page's
// TTFB. Public pages need no auth check at all.
export const config = { matcher: ['/admin/:path*'] };
