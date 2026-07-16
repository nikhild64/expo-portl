import { act, renderHook } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useNotificationsRealtime } from './useNotificationsRealtime';
import { createMutationWrapper } from './__testUtils/queryTestUtils';

const mockChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
};
mockChannel.on.mockReturnValue(mockChannel);
mockChannel.subscribe.mockReturnValue(mockChannel);

const mockChannelFn = jest.fn(() => mockChannel);
const mockRemoveChannel = jest.fn();
const mockUseAuthStore = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: (name: string) => mockChannelFn(name),
    removeChannel: (channel: unknown) => mockRemoveChannel(channel),
  },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => mockUseAuthStore(selector),
}));

function getInsertHandler() {
  const onCall = mockChannel.on.mock.calls.find((call) => call[0] === 'postgres_changes');
  return onCall?.[2] as ((payload: { new: { category?: string } }) => void) | undefined;
}

describe('useNotificationsRealtime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ session: { user: { id: 'user-1' } } }),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not subscribe without a signed-in user', () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ session: null }));
    const { wrapper } = createMutationWrapper();

    renderHook(() => useNotificationsRealtime(), { wrapper });

    expect(mockChannelFn).not.toHaveBeenCalled();
  });

  it('subscribes to notification inserts for the current user', () => {
    const { wrapper } = createMutationWrapper();

    renderHook(() => useNotificationsRealtime(), { wrapper });

    expect(mockChannelFn).toHaveBeenCalledWith('realtime-notifications-user-1');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'profile_id=eq.user-1',
      },
      expect.any(Function),
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('debounces list and category invalidations on insert', () => {
    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useNotificationsRealtime(), { wrapper });

    const handler = getInsertHandler();

    act(() => {
      handler?.({ new: { category: 'visitor' } });
      handler?.({ new: { category: 'notice' } });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notifications', 'list', 'user-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notifications', 'unread-count', 'user-1'] });
  });

  it('removes the channel on unmount', () => {
    const { wrapper } = createMutationWrapper();
    const { unmount } = renderHook(() => useNotificationsRealtime(), { wrapper });

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });
});
