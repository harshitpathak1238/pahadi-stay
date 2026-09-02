import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasValidTripDates } from '../../lib/trip-logic';
import { isAllowedAdminEmail, isAllowedAdminRole } from '../../lib/admin';

describe('admin access helpers', () => {
  beforeEach(() => vi.stubEnv('ADMIN_EMAILS', 'harshitpathak1238@gmail.com,Nilanshnegi1717@gmail.com'));

  it('accepts configured admin roles and emails', () => {
    expect(isAllowedAdminRole('OWNER')).toBe(true);
    expect(isAllowedAdminRole('CUSTOMER')).toBe(false);
    expect(isAllowedAdminEmail('harshitpathak1238@gmail.com')).toBe(true);
    expect(isAllowedAdminEmail('guest@example.com')).toBe(false);
  });
});

describe('trip date validation', () => {
  it('rejects empty, invalid, or reversed date ranges', () => {
    expect(hasValidTripDates('', '2026-09-02')).toBe(false);
    expect(hasValidTripDates('2026-09-05', '2026-09-04')).toBe(false);
    expect(hasValidTripDates('2026-09-01', '2026-09-02')).toBe(true);
  });
});
