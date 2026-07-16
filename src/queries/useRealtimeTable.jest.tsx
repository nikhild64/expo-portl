import { act, renderHook } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useRealtimeTable } from './useRealtimeTable';
import { createMutationWrapper } from './__testUtils/queryTestUtils';

const mockChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
};
mockChannel.on.mockReturnValue(mockChannel);

const mockChannelFn = jest.fn(() => mockChannel);
const mockRemoveChannel = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: (name: string) => mockChannelFn(name),
    removeChannel: (channel: unknown) => mockRemoveChannel(channel),
  },
}));

function getPostgresHandler() {
  const onCall = mockChannel.on.mock.calls.find((call) => call[0] === 'postgres_changes');
  return onCall?.[2] as (() => void) | undefined;
}

mockChannel.subscribe.mockReturnValue(mockChannel);

describe('useRealtimeTable', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not subscribe when disabled', () => {
    const { wrapper } = createMutationWrapper();
    renderHook(
      () =>
        useRealtimeTable({
          enabled: false,
          table: 'notices',
          invalidateKeys: [['notices']],
        }),
      { wrapper },
    );

    expect(mockChannelFn).not.toHaveBeenCalled();
  });

  it('subscribes to postgres changes for a table', () => {
    const { wrapper } = createMutationWrapper();
    renderHook(
      () =>
        useRealtimeTable({
          table: 'notices',
          filter: 'society_id=eq.soc-1',
          invalidateKeys: [['notices', 'soc-1']],
        }),
      { wrapper },
    );

    expect(mockChannelFn).toHaveBeenCalledWith('realtime-notices-society_id-eq-soc-1');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notices', filter: 'society_id=eq.soc-1' },
      expect.any(Function),
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('debounces query invalidations on change events', () => {
    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    renderHook(
      () =>
        useRealtimeTable({
          table: 'notices',
          debounceMs: 200,
          invalidateKeys: [['notices'], ['notices', 'detail']],
        }),
      { wrapper },
    );

    const handler = getPostgresHandler();

    act(() => {
      handler?.();
      handler?.();
    });

    expect(invalidateSpy).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notices'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notices', 'detail'] });
  });

  it('removes the channel on unmount', () => {
    const { wrapper } = createMutationWrapper();
    const { unmount } = renderHook(
      () =>
        useRealtimeTable({
          table: 'notices',
          invalidateKeys: [['notices']],
        }),
      { wrapper },
    );

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });
});
