import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthStore } from './authStore';
import { registerPushToken } from '@/lib/notifications';

const mockGetSession = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockExchangeCodeForSession = jest.fn();
const mockSetSession = jest.fn();
const mockUpdateUser = jest.fn();
const mockUnsubscribe = jest.fn();
const mockReplace = jest.fn();
const mockFrom = jest.fn();

let authStateChangeHandler: ((event: string, session: unknown) => Promise<void>) | undefined;

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
      onAuthStateChange: jest.fn((callback: (event: string, session: unknown) => Promise<void>) => {
        authStateChangeHandler = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      }),
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      setSession: (...args: unknown[]) => mockSetSession(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
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

let originalConsoleWarn: typeof console.warn;
beforeAll(() => {
  originalConsoleWarn = console.warn;
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

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
          maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null }),
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
              maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null }),
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
      options: {
        data: {
          display_name: 'New Guard',
          full_name: 'New Guard',
        },
      },
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
              maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null }),
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

  it('clears auth transition when sign-up fails', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: new Error('Email taken') });

    await expect(
      useAuthStore.getState().signUp({
        email: 'taken@portl.demo',
        password: 'Portl@123',
        fullName: 'Taken User',
      }),
    ).rejects.toThrow('Email taken');

    expect(useAuthStore.getState().authTransition).toBeNull();
  });

  it('returns early when sign-up creates no user', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: null });

    await useAuthStore.getState().signUp({
      email: 'pending@portl.demo',
      password: 'Portl@123',
      fullName: 'Pending User',
    });

    expect(mockFrom).not.toHaveBeenCalled();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('clears auth transition when profile insert fails', async () => {
    const session = { user: { id: 'user-2' } };

    mockSignUp.mockResolvedValue({ data: { user: session.user, session }, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          insert: jest.fn().mockResolvedValue({ error: new Error('Profile insert failed') }),
        };
      }
      return {};
    });

    await expect(
      useAuthStore.getState().signUp({
        email: 'fail@portl.demo',
        password: 'Portl@123',
        fullName: 'Fail User',
      }),
    ).rejects.toThrow('Profile insert failed');

    expect(useAuthStore.getState().authTransition).toBeNull();
  });
});

function makeRecoveryToken(issuer: string) {
  const payload = Buffer.from(JSON.stringify({ iss: issuer })).toString('base64');
  return `hdr.${payload}.sig`;
}

function mockProfileQuery(profile: Record<string, unknown>, error: Error | null = null) {
  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: profile, error }),
        maybeSingle: jest.fn().mockResolvedValue({ data: profile, error }),
      }),
    }),
  });
}

describe('authStore bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateChangeHandler = undefined;
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: true,
      authTransition: null,
      bootstrapError: null,
      hasSeenOnboarding: false,
    });
  });

  it('restores session and profile on startup', async () => {
    const session = { user: { id: 'user-1' } };
    const profile = { id: 'user-1', role: 'resident', status: 'active', society_id: 'soc-1' };

    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    mockProfileQuery(profile);

    await useAuthStore.getState().bootstrap();

    expect(mockGetSession).toHaveBeenCalled();
    expect(useAuthStore.getState().session).toEqual(session);
    expect(useAuthStore.getState().profile).toEqual(profile);
    expect(useAuthStore.getState().isBootstrapping).toBe(false);
    expect(useAuthStore.getState().bootstrapError).toBeNull();
  });

  it('loads hasSeenOnboarding from AsyncStorage', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

    await useAuthStore.getState().bootstrap();

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('portl:onboarded');
    expect(useAuthStore.getState().hasSeenOnboarding).toBe(true);
    expect(useAuthStore.getState().isBootstrapping).toBe(false);
  });

  it('sets bootstrapError when bootstrap fails', async () => {
    mockGetSession.mockRejectedValue(new Error('Network unavailable'));

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().bootstrapError).toBe('Network unavailable');
    expect(useAuthStore.getState().isBootstrapping).toBe(false);
  });

  it('registers push token for active profiles on startup', async () => {
    const session = { user: { id: 'user-1' } };
    const profile = { id: 'user-1', role: 'resident', status: 'active', society_id: 'soc-1' };

    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    mockProfileQuery(profile);

    await useAuthStore.getState().bootstrap();

    expect(registerPushToken).toHaveBeenCalledWith('user-1');
    expect(authStateChangeHandler).toBeDefined();
  });
});

describe('authStore retryBootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateChangeHandler = undefined;
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: true,
      authTransition: null,
      bootstrapError: 'Network unavailable',
      hasSeenOnboarding: false,
    });
  });

  it('re-runs bootstrap after a failure', async () => {
    mockGetSession
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({ data: { session: null }, error: null });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().bootstrapError).toBe('Network unavailable');

    await useAuthStore.getState().retryBootstrap();

    expect(mockGetSession).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().bootstrapError).toBeNull();
    expect(useAuthStore.getState().isBootstrapping).toBe(false);
  });
});

describe('authStore onAuthStateChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateChangeHandler = undefined;
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: false,
      authTransition: null,
      bootstrapError: null,
      hasSeenOnboarding: false,
    });
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  async function setupListener() {
    await useAuthStore.getState().bootstrap();
    expect(authStateChangeHandler).toBeDefined();
    return authStateChangeHandler!;
  };

  it('ignores INITIAL_SESSION after updating session', async () => {
    const session = { user: { id: 'user-1' } };
    const handler = await setupListener();

    await handler('INITIAL_SESSION', session);

    expect(useAuthStore.getState().session).toEqual(session);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('refreshes profile and registers push on SIGNED_IN', async () => {
    const session = { user: { id: 'user-1' } };
    const profile = { id: 'user-1', role: 'resident', status: 'active', society_id: 'soc-1' };
    const handler = await setupListener();
    mockProfileQuery(profile);

    await handler('SIGNED_IN', session);

    expect(useAuthStore.getState().session).toEqual(session);
    expect(useAuthStore.getState().profile).toEqual(profile);
    expect(registerPushToken).toHaveBeenCalledWith('user-1');
  });

  it('clears profile when session is removed', async () => {
    const handler = await setupListener();
    useAuthStore.setState({
      session: { user: { id: 'user-1' } } as never,
      profile: { id: 'user-1', role: 'resident', status: 'active', society_id: 'soc-1' } as never,
    });

    await handler('SIGNED_OUT', null);

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
  });
});

describe('authStore refreshProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: false,
      authTransition: null,
      bootstrapError: null,
      hasSeenOnboarding: false,
    });
  });

  it('returns early when there is no session', async () => {
    await useAuthStore.getState().refreshProfile();

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('clears profile when profile fetch fails', async () => {
    useAuthStore.setState({
      session: { user: { id: 'user-1' } } as never,
      profile: { id: 'user-1', role: 'resident', status: 'active', society_id: 'soc-1' } as never,
    });
    mockProfileQuery({ id: 'user-1' }, new Error('Profile missing'));

    await useAuthStore.getState().refreshProfile({ force: true });

    expect(useAuthStore.getState().profile).toBeNull();
  });

  it('refetches profile when force refresh is requested', async () => {
    const cachedProfile = { id: 'user-1', role: 'resident', status: 'pending', society_id: null };
    const refreshedProfile = { id: 'user-1', role: 'resident', status: 'active', society_id: 'soc-1' };
    const mockSingle = jest.fn().mockResolvedValue({ data: refreshedProfile, error: null });

    useAuthStore.setState({
      session: { user: { id: 'user-1' } } as never,
      profile: cachedProfile as never,
    });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ single: mockSingle, maybeSingle: mockSingle }),
      }),
    });

    await useAuthStore.getState().refreshProfile({ force: true });

    expect(mockSingle).toHaveBeenCalled();
    expect(useAuthStore.getState().profile).toEqual(refreshedProfile);
  });
});

describe('authStore setOnboarded', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: false,
      authTransition: null,
      bootstrapError: null,
      hasSeenOnboarding: false,
    });
  });

  it('persists onboarding flag and updates store state', async () => {
    await useAuthStore.getState().setOnboarded();

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('portl:onboarded', 'true');
    expect(useAuthStore.getState().hasSeenOnboarding).toBe(true);
  });
});

describe('authStore sendPasswordResetEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: false,
      authTransition: null,
      bootstrapError: null,
      hasSeenOnboarding: false,
    });
  });

  it('sends reset email with app redirect URL', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    await useAuthStore.getState().sendPasswordResetEmail('resident@portl.demo');

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('resident@portl.demo', {
      redirectTo: 'portl-nd://reset-password',
    });
  });

  it('throws when reset email request fails', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: new Error('Rate limited') });

    await expect(
      useAuthStore.getState().sendPasswordResetEmail('resident@portl.demo'),
    ).rejects.toThrow('Rate limited');
  });
});

describe('authStore setRecoverySessionFromUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      session: null,
      profile: null,
      isBootstrapping: false,
      authTransition: null,
      bootstrapError: null,
      hasSeenOnboarding: false,
    });
  });

  it('throws when the recovery link contains an error', async () => {
    await expect(
      useAuthStore.getState().setRecoverySessionFromUrl('portl://reset-password?error_description=Link+expired'),
    ).rejects.toThrow('Link expired');
  });

  it('exchanges a recovery code for a session', async () => {
    const session = { user: { id: 'user-1' } };
    mockExchangeCodeForSession.mockResolvedValue({ data: { session }, error: null });

    await useAuthStore.getState().setRecoverySessionFromUrl('portl://reset-password?code=recovery-code');

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('recovery-code');
    expect(useAuthStore.getState().session).toEqual(session);
  });

  it('sets session from hash tokens when code is absent', async () => {
    const session = { user: { id: 'user-1' } };
    const accessToken = makeRecoveryToken('https://example.supabase.co/auth/v1');
    mockSetSession.mockResolvedValue({ data: { session }, error: null });

    await useAuthStore.getState().setRecoverySessionFromUrl(
      `portl://reset-password#access_token=${accessToken}&refresh_token=refresh-token`,
    );

    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: accessToken,
      refresh_token: 'refresh-token',
    });
    expect(useAuthStore.getState().session).toEqual(session);
  });

  it('rejects recovery tokens from another issuer', async () => {
    const accessToken = makeRecoveryToken('https://other.supabase.co/auth/v1');

    await expect(
      useAuthStore.getState().setRecoverySessionFromUrl(
        `portl://reset-password#access_token=${accessToken}&refresh_token=refresh-token`,
      ),
    ).rejects.toThrow('Recovery link is not from this app.');
  });
});

describe('authStore updatePassword', () => {
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

  it('updates password and signs out on success', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const updatePromise = useAuthStore.getState().updatePassword('NewPortl@123');

    await updatePromise;
    jest.advanceTimersByTime(400);

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPortl@123' });
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('throws when password update fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: new Error('Weak password') });

    await expect(useAuthStore.getState().updatePassword('weak')).rejects.toThrow('Weak password');
    expect(mockSignOut).not.toHaveBeenCalled();
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

  it('routes to onboarding when user has not seen onboarding', async () => {
    useAuthStore.setState({ hasSeenOnboarding: false });

    const signOutPromise = useAuthStore.getState().signOut();

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/onboarding');

    await signOutPromise;
    jest.advanceTimersByTime(400);
    expect(useAuthStore.getState().authTransition).toBeNull();
  });
});
