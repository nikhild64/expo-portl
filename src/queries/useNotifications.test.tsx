import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from './useNotifications';
import { createMutationWrapper, createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();
const mockUseAuthStore = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => mockUseAuthStore(selector),
}));

const notification = {
  id: 'n-1',
  profile_id: 'user-1',
  read_at: null,
  title: 'Visitor waiting',
  body: 'Alex is at the gate',
  created_at: '2026-07-15T10:00:00.000Z',
} as const;

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ session: { user: { id: 'user-1' } } }),
    );
  });

  it('loads notifications for the signed-in user', async () => {
    const chain = createSelectChain({ data: [notification], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useNotifications(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(chain.limit).toHaveBeenCalledWith(200);
  });

  it('loads unread notification count', async () => {
    const chain = createSelectChain({ data: null, error: null });
    const countResult = { count: 3, error: null };
    Object.assign(chain, {
      then: (onFulfilled: (value: typeof countResult) => unknown) => Promise.resolve(countResult).then(onFulfilled),
    });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useUnreadNotificationCount(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(chain.is).toHaveBeenCalledWith('read_at', null);
    expect(result.current.data).toBe(3);
  });

  it('optimistically marks one notification as read', async () => {
    const eq = jest.fn(() => ({ is: jest.fn().mockResolvedValue({ error: null }) }));
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    queryClient.setQueryData(['notifications', 'list', 'user-1'], [notification]);
    queryClient.setQueryData(['notifications', 'unread-count', 'user-1'], 1);

    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('n-1');
    });

    expect(queryClient.getQueryData<number>(['notifications', 'unread-count', 'user-1'])).toBe(0);
    expect(
      queryClient.getQueryData<Array<{ id: string; read_at: string | null }>>(['notifications', 'list', 'user-1'])?.[0]
        ?.read_at,
    ).toEqual(expect.any(String));
  });

  it('optimistically marks all notifications as read', async () => {
    const eq = jest.fn(() => ({ is: jest.fn().mockResolvedValue({ error: null }) }));
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    queryClient.setQueryData(['notifications', 'list', 'user-1'], [notification]);
    queryClient.setQueryData(['notifications', 'unread-count', 'user-1'], 2);

    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(['notifications', 'unread-count', 'user-1'])).toBe(0);
  });
});
