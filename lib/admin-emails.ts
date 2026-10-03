/**
 * Admin emails used by client-side chrome (header links, mobile drawer).
 *
 * Reads `NEXT_PUBLIC_ADMIN_EMAILS`, which Next.js inlines into the browser
 * bundle at build time. That list only controls whether an admin shortcut is
 * *shown*; it grants no access. Every request to `/admin` is still gated by
 * `middleware.ts` and `lib/admin.ts`, which read the server-only
 * `ADMIN_EMAILS`.
 *
 * Kept dependency-free so both server and client modules can import it without
 * pulling in Prisma.
 */
export function adminEmailList(): string[] {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Convenience wrapper for "is this signed-in email an admin?". */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmailList().includes(email.toLowerCase());
}
