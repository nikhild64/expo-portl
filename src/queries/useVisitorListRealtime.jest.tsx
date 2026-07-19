import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useVisitorListRealtime } from './useVisitorListRealtime';
import { createMutationWrapper } from './__testUtils/queryTestUtils';

const mockChannel = {
  on: jest.fn<any>(),
  subscribe: jest.fn<any>(),
};
mockChannel.on.mockReturnValue(mockChannel);

const mockChannelFn = jest.fn<any>((_name?: string) => mockChannel);
const mockRemoveChannel = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: (name: string) => mockChannelFn(name),
    removeChannel: (channel: unknown) => mockRemoveChannel(channel),
  },
}));

const flatIds = ['flat-1'];
const baseVisitor = {
  id: 'visitor-1',
  flat_id: 'flat-1',
  society_id: 'soc-1',
  status: 'pending' as const,
  type: 'guest' as const,
  visitor_name: 'Alex Guest',
  requested_at: '2026-07-16T10:00:00.000Z',
  decided_at: null,
  decided_by: null,
  entered_at: null,
  exited_at: null,
  guard_id: null,
  guard_note: null,
  pre_approval_id: null,
  pre_approved: false,
  purpose: null,
  resident_instructions: null,
  visitor_phone: null,
  visitor_photo_path: null,
};

function getPostgresHandler() {
  const onCall = mockChannel.on.mock.calls.find((call: any[]) => call[0] === 'postgres_changes');
  return onCall?.[2] as
    | ((payload: { eventType: string; new: any; old: any }) => void)
    | undefined;
}

mockChannel.subscribe.mockReturnValue(mockChannel);

describe('useVisitorListRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);
  });

  it('does not subscribe when flatIds are missing', () => {
    const { wrapper } = createMutationWrapper();
    renderHook(() => useVisitorListRealtime(undefined), { wrapper });

    expect(mockChannelFn).not.toHaveBeenCalled();
  });

  it('does not subscribe when disabled', () => {
    const { wrapper } = createMutationWrapper();
    renderHook(() => useVisitorListRealtime(flatIds, false), { wrapper });

    expect(mockChannelFn).not.toHaveBeenCalled();
  });

  it('subscribes to visitor changes for a single flat', () => {
    const { wrapper } = createMutationWrapper();
    renderHook(() => useVisitorListRealtime(flatIds), { wrapper });

    expect(mockChannelFn).toHaveBeenCalledWith('visitor-lists-flat_id=eq.flat-1');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'visitors', filter: 'flat_id=eq.flat-1' },
      expect.any(Function),
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('uses an in filter when multiple flats are provided', () => {
    const { wrapper } = createMutationWrapper();
    renderHook(() => useVisitorListRealtime(['flat-1', 'flat-2']), { wrapper });

    expect(mockChannelFn).toHaveBeenCalledWith('visitor-lists-flat_id=in.(flat-1,flat-2)');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'visitors', filter: 'flat_id=in.(flat-1,flat-2)' },
      expect.any(Function),
    );
  });

  it('upserts pending visitors into the pending cache', () => {
    const { queryClient, wrapper } = createMutationWrapper();
    renderHook(() => useVisitorListRealtime(flatIds), { wrapper });

    const handler = getPostgresHandler();
    const pendingKey = ['visitors', 'pending', flatIds];
    const historyKey = ['visitors', 'history', flatIds];

    queryClient.setQueryData(pendingKey, []);
    queryClient.setQueryData(historyKey, []);

    act(() => {
      handler?.({ eventType: 'INSERT', new: baseVisitor, old: baseVisitor });
    });

    expect(queryClient.getQueryData(pendingKey)).toEqual([baseVisitor]);
    expect(queryClient.getQueryData(historyKey)).toEqual([]);
    expect(queryClient.getQueryData(['visitors', 'detail', 'visitor-1'])).toEqual(baseVisitor);
  });

  it('moves approved visitors from pending to history', () => {
    const { queryClient, wrapper } = createMutationWrapper();
    renderHook(() => useVisitorListRealtime(flatIds), { wrapper });

    const handler = getPostgresHandler();
    const pendingKey = ['visitors', 'pending', flatIds];
    const historyKey = ['visitors', 'history', flatIds];
    const approved = { ...baseVisitor, status: 'approved' as const };

    queryClient.setQueryData(pendingKey, [baseVisitor]);
    queryClient.setQueryData(historyKey, []);

    act(() => {
      handler?.({ eventType: 'UPDATE', new: approved, old: baseVisitor });
    });

    expect(queryClient.getQueryData(pendingKey)).toEqual([]);
    expect(queryClient.getQueryData(historyKey)).toEqual([approved]);
  });

  it('removes visitors from both caches on delete', () => {
    const { queryClient, wrapper } = createMutationWrapper();
    renderHook(() => useVisitorListRealtime(flatIds), { wrapper });

    const handler = getPostgresHandler();
    const pendingKey = ['visitors', 'pending', flatIds];
    const historyKey = ['visitors', 'history', flatIds];

    queryClient.setQueryData(pendingKey, [baseVisitor]);
    queryClient.setQueryData(historyKey, [{ ...baseVisitor, status: 'approved' as const }]);

    act(() => {
      handler?.({ eventType: 'DELETE', new: baseVisitor, old: baseVisitor });
    });

    expect(queryClient.getQueryData(pendingKey)).toEqual([]);
    expect(queryClient.getQueryData(historyKey)).toEqual([]);
  });

  it('removes the channel on unmount', () => {
    const { wrapper } = createMutationWrapper();
    const { unmount } = renderHook(() => useVisitorListRealtime(flatIds), { wrapper });

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('covers upsertVisitor existing index, undefined list, and unrelated flat_id', () => {
    const { queryClient, wrapper } = createMutationWrapper();
    renderHook(() => useVisitorListRealtime(flatIds), { wrapper });

    const handler = getPostgresHandler();
    const pendingKey = ['visitors', 'pending', flatIds];

    queryClient.setQueryData(pendingKey, undefined);

    act(() => {
      handler?.({ eventType: 'INSERT', new: baseVisitor, old: baseVisitor });
    });
    expect(queryClient.getQueryData(pendingKey)).toEqual([baseVisitor]);

    const updatedVisitor = { ...baseVisitor, visitor_name: 'Alex Guest Updated' };
    act(() => {
      handler?.({ eventType: 'UPDATE', new: updatedVisitor, old: baseVisitor });
    });
    expect(queryClient.getQueryData(pendingKey)).toEqual([updatedVisitor]);

    const unrelatedVisitor = { ...baseVisitor, id: 'unrelated', flat_id: 'flat-99' };
    act(() => {
      handler?.({ eventType: 'INSERT', new: unrelatedVisitor, old: unrelatedVisitor });
    });
    expect(queryClient.getQueryData(pendingKey)).toEqual([updatedVisitor]);
  });

  it('handles DELETE when list is undefined', () => {
    const { queryClient, wrapper } = createMutationWrapper();
    renderHook(() => useVisitorListRealtime(flatIds), { wrapper });

    const handler = getPostgresHandler();
    const pendingKey = ['visitors', 'pending', flatIds];
    queryClient.setQueryData(pendingKey, undefined);

    act(() => {
      handler?.({ eventType: 'DELETE', new: baseVisitor, old: baseVisitor });
    });
    expect(queryClient.getQueryData(pendingKey)).toEqual([]);
  });

  it('handles events when ids is empty or undefined', () => {
    const { wrapper } = createMutationWrapper();
    const { rerender } = renderHook(({ ids }: { ids: string[] | undefined }) => useVisitorListRealtime(ids), {
      wrapper,
      initialProps: { ids: flatIds as string[] | undefined },
    });

    const handler = getPostgresHandler();

    rerender({ ids: undefined });

    act(() => {
      handler?.({ eventType: 'INSERT', new: baseVisitor, old: baseVisitor });
    });
  });
});
