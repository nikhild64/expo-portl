import { useAuthStore } from './authStore';

const mockGetSession = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'portl-nd://reset-password'),
}));

jest.mock('@/lib/queryClient', () => ({
  queryClient: { clear: jest.fn() },
}));

jest.mock('@/env', () => ({
  env: { supabaseUrl: 'https://example.supabase.co' },
}));

jest.mock('@/lib/notifications', () => ({
  registerPushToken: jest.fn(() => Promise.resolve()),
  unregisterPushToken: jest.fn(() => Promise.resolve()),
}));

describe('authStore signIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: false,
      hasSeenOnboarding: false,
    });
  });

  it('stores session and profile on successful sign-in', async () => {
    const session = { user: { id: 'user-1' } };
    const profile = { id: 'user-1', role: 'resident', status: 'active', society_id: 'soc-1' };

    mockSignInWithPassword.mockResolvedValue({ data: { session }, error: null });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: profile, error: null }),
        }),
      }),
    });

    await useAuthStore.getState().signIn({ email: 'resident@portl.demo', password: 'Portl@123' });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'resident@portl.demo',
      password: 'Portl@123',
    });
    expect(useAuthStore.getState().session).toEqual(session);
    expect(useAuthStore.getState().profile).toEqual(profile);
  });
});
