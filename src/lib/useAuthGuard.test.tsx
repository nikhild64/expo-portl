import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { alertWarning } from '@/lib/alert';
import { resolveAuthBlockReason, useAuthGuard } from './useAuthGuard';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('@/lib/alert', () => ({
  alertWarning: jest.fn(),
}));

jest.mock('@/i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

const mockUseAuthStore = jest.fn();

const mockGetState = jest.fn(() => ({
  session: { user: { id: 'user-1' } },
  hasSeenOnboarding: true,
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (state: unknown) => unknown) => mockUseAuthStore(selector),
    {
      getState: () => mockGetState(),
    },
  ),
}));

const { router } = jest.requireMock('expo-router') as {
  router: { replace: jest.Mock };
};

const activeResidentProfile = {
  id: 'user-1',
  role: 'resident',
  status: 'active',
  society_id: 'society-1',
} as const;

function Guarded({ role }: { role: 'resident' | 'guard' | 'admin' }) {
  const { isReady } = useAuthGuard(role);
  return isReady ? <Text>ready</Text> : null;
}

describe('resolveAuthBlockReason', () => {
  const base = {
    session: { user: { id: 'user-1' } },
    profile: activeResidentProfile,
    isBootstrapping: false,
    bootstrapError: null,
    requiredRole: 'resident' as const,
  };

  it('returns bootstrapping while auth is loading', () => {
    expect(resolveAuthBlockReason({ ...base, isBootstrapping: true })).toBe('bootstrapping');
  });

  it('returns no_session without a session', () => {
    expect(resolveAuthBlockReason({ ...base, session: null })).toBe('no_session');
  });

  it('returns no_society when profile has no society', () => {
    expect(resolveAuthBlockReason({ ...base, profile: { ...activeResidentProfile, society_id: null } })).toBe(
      'no_society',
    );
  });

  it('returns pending for pending profiles', () => {
    expect(resolveAuthBlockReason({ ...base, profile: { ...activeResidentProfile, status: 'pending' } })).toBe(
      'pending',
    );
  });

  it('returns wrong_role when role mismatches', () => {
    expect(resolveAuthBlockReason({ ...base, requiredRole: 'admin' })).toBe('wrong_role');
  });

  it('returns null when access is allowed', () => {
    expect(resolveAuthBlockReason(base)).toBeNull();
  });

  it('returns no_session for blocked profiles', () => {
    expect(
      resolveAuthBlockReason({ ...base, profile: { ...activeResidentProfile, status: 'blocked' } }),
    ).toBe('no_session');
  });
});

describe('useAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      session: { user: { id: 'user-1' } },
      hasSeenOnboarding: true,
    });
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: { user: { id: 'user-1' } },
        profile: activeResidentProfile,
        isBootstrapping: false,
        bootstrapError: null,
        authTransition: null,
      }),
    );
  });

  it('is not ready when role mismatches', () => {
    const { queryByText } = render(<Guarded role="admin" />);
    expect(queryByText('ready')).toBeNull();
  });

  it('renders children when role matches', () => {
    const { getByText } = render(<Guarded role="resident" />);
    expect(getByText('ready')).toBeTruthy();
  });

  it('redirects pending users to pending approval', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: { user: { id: 'user-1' } },
        profile: { ...activeResidentProfile, status: 'pending' },
        isBootstrapping: false,
        bootstrapError: null,
      }),
    );

    render(<Guarded role="resident" />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(auth)/pending-approval');
    });
  });

  it('redirects users without a society to join society', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: { user: { id: 'user-1' } },
        profile: { ...activeResidentProfile, society_id: null },
        isBootstrapping: false,
        bootstrapError: null,
      }),
    );

    render(<Guarded role="resident" />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(auth)/join-society');
    });
  });

  it('redirects wrong-role users to sign-in with a warning', async () => {
    render(<Guarded role="admin" />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(auth)/sign-in');
      expect(alertWarning).toHaveBeenCalledWith(
        'auth.wrongAccountType.title',
        'auth.wrongAccountType.message',
      );
    });
  });

  it('redirects blocked users to home', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: { user: { id: 'user-1' } },
        profile: { ...activeResidentProfile, status: 'blocked' },
        isBootstrapping: false,
        bootstrapError: null,
        authTransition: null,
      }),
    );

    render(<Guarded role="resident" />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  it('redirects users without a session to sign-in when onboarding was seen', async () => {
    mockGetState.mockReturnValue({
      session: null,
      hasSeenOnboarding: true,
    });
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: null,
        profile: null,
        isBootstrapping: false,
        bootstrapError: null,
        authTransition: null,
      }),
    );

    render(<Guarded role="resident" />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(auth)/sign-in');
    });
  });

  it('redirects users without a session to onboarding when first launch', async () => {
    mockGetState.mockReturnValue({
      session: null,
      hasSeenOnboarding: false,
    });
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: null,
        profile: null,
        isBootstrapping: false,
        bootstrapError: null,
        authTransition: null,
      }),
    );

    render(<Guarded role="resident" />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(auth)/onboarding');
    });
  });

  it('redirects bootstrap failures with an active session to home', async () => {
    mockGetState.mockReturnValue({
      session: { user: { id: 'user-1' } },
      hasSeenOnboarding: true,
    });
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: { user: { id: 'user-1' } },
        profile: null,
        isBootstrapping: false,
        bootstrapError: 'profile missing',
        authTransition: null,
      }),
    );

    render(<Guarded role="resident" />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  it('does not redirect while bootstrapping', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: null,
        profile: null,
        isBootstrapping: true,
        bootstrapError: null,
        authTransition: null,
      }),
    );

    render(<Guarded role="resident" />);

    await waitFor(() => {
      expect(router.replace).not.toHaveBeenCalled();
    });
  });
});
