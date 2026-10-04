/**
 * Admin visibility helpers used by client-side chrome (header links, mobile
 * drawer, account menu).
 *
 * The primary signal is the signed-in user's **role**, which `lib/auth.ts`
 * copies into the session from the database. `middleware.ts` and `lib/admin.ts`
 * authorise on that same role, so the link can never disagree with the gate.
 *
 * `NEXT_PUBLIC_ADMIN_EMAILS` is only a fallback for sessions issued before a
 * role was attached. It is intentionally a *separate* variable from the
 * server-only `ADMIN_EMAILS` and is inlined into the browser bundle at build
 * time, so it is not a secret and grants nothing on its own.
 *
 * Kept dependency-free so both server and client modules can import it without
 * pulling in Prisma.
 */

/** Roles that may open the admin workspace. Mirrors `isAllowedAdminRole`. */
export const ADMIN_ROLES = ['ADMIN', 'OWNER', 'STAFF'] as const;

/** Whether a role grants admin workspace access. Case-insensitive. */
export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return (ADMIN_ROLES as readonly string[]).includes(role.toUpperCase());
}

/** Email allowlist fallback, read from the public twin of `ADMIN_EMAILS`. */
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

/**
 * Whether the current session should be shown the admin shortcuts.
 *
 * Prefers the role carried in the session and only falls back to the public
 * email list, so an admin whose email is not listed still gets the link.
 */
export function isAdminUser(user?: { email?: string | null; role?: string | null } | null): boolean {
  if (!user) return false;
  return isAdminRole(user.role) || isAdminEmail(user.email);
}
