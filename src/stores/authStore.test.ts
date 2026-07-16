import { useAuthStore } from './authStore';
import { registerPushToken } from '@/lib/notifications';

const mockGetSession = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockReplace = jest.fn();
const mockFrom = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('@/lib/offlineQueue', () => ({
  clearOfflineQueue: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
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
    jest.useFakeTimers();
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: false,
      authTransition: null,
      hasSeenOnboarding: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
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
    expect(useAuthStore.getState().authTransition).toBe('signIn');
    expect(registerPushToken).not.toHaveBeenCalled();
  });

  it('clears auth transition immediately when sign-in fails', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: null }, error: new Error('Invalid login') });

    await expect(
      useAuthStore.getState().signIn({ email: 'bad@portl.demo', password: 'wrong' }),
    ).rejects.toThrow('Invalid login');

    expect(useAuthStore.getState().authTransition).toBeNull();
  });
});

describe('authStore signUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: false,
      authTransition: null,
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

  it('creates a pending resident profile by default', async () => {
    const session = { user: { id: 'resident-new' } };
    const profile = { id: 'resident-new', role: 'resident', status: 'pending', society_id: null };
    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    mockSignUp.mockResolvedValue({ data: { user: session.user, session }, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          insert: mockInsert,
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
      email: 'newresident@portl.demo',
      password: 'Portl@123',
      fullName: 'New Resident',
    });

    expect(mockInsert).toHaveBeenCalledWith({
      id: 'resident-new',
      full_name: 'New Resident',
      role: 'resident',
      status: 'pending',
    });
    expect(useAuthStore.getState().profile).toEqual(profile);
  });
});

describe('authStore signOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSignOut.mockResolvedValue({ error: null });
    useAuthStore.setState({
      session: { user: { id: 'user-1' } } as never,
      profile: { id: 'user-1', role: 'resident', status: 'active', society_id: 'soc-1' } as never,
      isBootstrapping: false,
      authTransition: null,
      hasSeenOnboarding: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sets sign-out transition and clears session', async () => {
    const signOutPromise = useAuthStore.getState().signOut();

    expect(useAuthStore.getState().authTransition).toBe('signOut');
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in');

    await signOutPromise;

    expect(mockSignOut).toHaveBeenCalled();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();

    jest.advanceTimersByTime(400);
    expect(useAuthStore.getState().authTransition).toBeNull();
  });
});
