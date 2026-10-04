import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_ROLES, adminEmailList, isAdminEmail, isAdminRole, isAdminUser } from '../../lib/admin-emails';

/**
 * The header "Admin" shortcut used to be decided purely from
 * `NEXT_PUBLIC_ADMIN_EMAILS`. That variable is gitignored, must be duplicated
 * into every environment, and is inlined at build time — so an admin whose
 * deployment was missing it saw no admin link at all, even though the server
 * would have let them in. Visibility now keys off the session role, which is
 * the same value the server gate authorises on.
 */
describe('isAdminRole', () => {
  it('accepts every role that may open the admin workspace', () => {
    for (const role of ADMIN_ROLES) expect(isAdminRole(role)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isAdminRole('owner')).toBe(true);
    expect(isAdminRole('Staff')).toBe(true);
    expect(isAdminRole('admin')).toBe(true);
  });

  it('rejects non-admin roles', () => {
    expect(isAdminRole('CUSTOMER')).toBe(false);
    expect(isAdminRole('PARTNER')).toBe(false);
  });

  it('rejects empty or missing roles', () => {
    expect(isAdminRole('')).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe('adminEmailList', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('trims, lowercases and drops blanks', () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', ' Boss@Example.com , ,ops@example.com ');
    expect(adminEmailList()).toEqual(['boss@example.com', 'ops@example.com']);
  });

  it('is empty when the variable is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', '');
    expect(adminEmailList()).toEqual([]);
  });
});

describe('isAdminUser', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows admin links from the session role alone, with no email list configured', () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', '');
    expect(isAdminUser({ email: 'anyone@example.com', role: 'OWNER' })).toBe(true);
  });

  it('falls back to the public email allowlist when the session carries no role', () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', 'boss@example.com');
    expect(isAdminUser({ email: 'boss@example.com' })).toBe(true);
    expect(isAdminUser({ email: 'guest@example.com' })).toBe(false);
  });

  it('never shows admin links to a signed-out or role-less non-admin visitor', () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', 'boss@example.com');
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
    expect(isAdminUser({})).toBe(false);
    expect(isAdminUser({ email: 'guest@example.com', role: 'CUSTOMER' })).toBe(false);
  });
});

describe('isAdminEmail', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('matches the allowlist case-insensitively', () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_EMAILS', 'boss@example.com');
    expect(isAdminEmail('BOSS@example.com')).toBe(true);
    expect(isAdminEmail('guest@example.com')).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
});
