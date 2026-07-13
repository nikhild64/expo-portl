import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

const mockUseAuthStore = jest.fn();

jest.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (state: unknown) => unknown) => mockUseAuthStore(selector),
    {
      getState: () => ({
        session: { user: { id: 'user-1' } },
        hasSeenOnboarding: true,
      }),
    },
  ),
}));

import { useAuthGuard } from './useAuthGuard';

function Guarded({ role }: { role: 'resident' | 'guard' | 'admin' }) {
  const { isReady } = useAuthGuard(role);
  return isReady ? <Text>ready</Text> : null;
}

describe('useAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        session: { user: { id: 'user-1' } },
        profile: { id: 'user-1', role: 'resident', status: 'active' },
        isBootstrapping: false,
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
});
