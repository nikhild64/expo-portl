import { routeForAuthenticatedUser } from './authRoutes';

const baseProfile = {
  id: 'user-1',
  full_name: 'Test User',
  role: 'resident' as const,
  status: 'active' as const,
  society_id: 'soc-1',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  phone: null,
  avatar_path: null,
};

describe('routeForAuthenticatedUser', () => {
  it('routes users without a society to join society', () => {
    expect(routeForAuthenticatedUser({ ...baseProfile, society_id: null })).toBe('/(auth)/join-society');
  });

  it('routes pending users to pending approval', () => {
    expect(routeForAuthenticatedUser({ ...baseProfile, status: 'pending' })).toBe('/(auth)/pending-approval');
  });

  it('routes active users by role', () => {
    expect(routeForAuthenticatedUser({ ...baseProfile, role: 'resident' })).toBe('/(resident)/(home)');
    expect(routeForAuthenticatedUser({ ...baseProfile, role: 'guard' })).toBe('/(guard)');
    expect(routeForAuthenticatedUser({ ...baseProfile, role: 'admin' })).toBe('/(admin)');
  });

  it('falls back to sign-in for unknown roles', () => {
    expect(routeForAuthenticatedUser({ ...baseProfile, role: 'unknown' as never })).toBe('/(auth)/sign-in');
  });
});
