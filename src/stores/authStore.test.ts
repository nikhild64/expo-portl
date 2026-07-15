import { useAuthStore } from './authStore';

const mockGetSession = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
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

describe('authStore signUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: false,
      hasSeenOnboarding: false,
    });
  });

  it('stores session and profile before join-society navigation', async () => {
    const session = { user: { id: 'guard-1' } };
    const profile = { id: 'guard-1', role: 'guard', status: 'pending', society_id: null };

    mockSignUp.mockResolvedValue({ data: { user: session.user, session }, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: profile, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    await useAuthStore.getState().signUp({
      email: 'newguard@portl.demo',
      password: 'Portl@123',
      fullName: 'New Guard',
      role: 'guard',
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'newguard@portl.demo',
      password: 'Portl@123',
    });
    expect(useAuthStore.getState().session).toEqual(session);
    expect(useAuthStore.getState().profile).toEqual(profile);
  });
});
