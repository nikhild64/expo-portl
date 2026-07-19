import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import { useAdminVisitorHistory, useLiveGateFeed } from './useAdminVisitors';
import { createQueryWrapper, createMutationWrapper } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn<any>();
const mockRemoveChannel = jest.fn<any>();
const mockSubscribe = jest.fn<any>();
const mockOn = jest.fn<any>();
const mockChannel = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: unknown) => mockFrom(table),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

jest.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}));

function createVisitorHistoryChain<T>(result: { data: T; error: null }) {
  const chain: {
    eq: jest.Mock;
    gte: jest.Mock;
    lte: jest.Mock;
    ilike: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    select: jest.Mock;
  } = {
    eq: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    ilike: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.gte.mockReturnValue(chain);
  chain.lte.mockReturnValue(chain);
  chain.ilike.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  const promise = Promise.resolve(result);
  Object.assign(chain, {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  });
  return chain;
}

const visitor = {
  id: 'visitor-1',
  society_id: 'soc-1',
  visitor_name: 'Ravi',
  status: 'approved',
  requested_at: '2026-07-16T10:00:00.000Z',
};

describe('useAdminVisitorHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', async () => {
    const { queryClient, wrapper } = createMutationWrapper();
    renderHook(() => useAdminVisitorHistory(null), { wrapper });

    await waitFor(() => expect(queryClient.getQueryCache().getAll().length).toBe(1));
    const query = queryClient.getQueryCache().getAll()[0];
    const queryFn = query.options.queryFn as (ctx: any) => Promise<any>;
    const data = await queryFn({} as any);
    expect(data).toEqual([]);
  });

  it('loads visitor history with date, status, and search filters', async () => {
    const chain = createVisitorHistoryChain({ data: [visitor], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(
      () =>
        useAdminVisitorHistory('soc-1', {
          from: '2026-07-01',
          to: '2026-07-16',
          status: 'approved',
          search: 'Ravi',
        }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.gte).toHaveBeenCalledWith('requested_at', '2026-07-01');
    expect(chain.lte).toHaveBeenCalledWith('requested_at', '2026-07-16');
    expect(chain.eq).toHaveBeenCalledWith('status', 'approved');
    expect(chain.ilike).toHaveBeenCalledWith('visitor_name', '%Ravi%');
    expect(result.current.data).toEqual([visitor]);
  });

  it('loads visitor history with default empty filters', async () => {
    const chain = createVisitorHistoryChain({ data: [visitor], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAdminVisitorHistory('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
  });

  it('throws error when database query fails', async () => {
    const chain = createVisitorHistoryChain({ data: null, error: { message: 'DB Error' } } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAdminVisitorHistory('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('DB Error');
  });
});

describe('useLiveGateFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOn.mockReturnValue({ subscribe: mockSubscribe });
    mockChannel.mockReturnValue({ on: mockOn });
  });

  it('does not fetch when societyId is missing', async () => {
    const { queryClient, wrapper } = createMutationWrapper();
    renderHook(() => useLiveGateFeed(null), { wrapper });

    await waitFor(() => expect(queryClient.getQueryCache().getAll().length).toBe(1));
    const query = queryClient.getQueryCache().getAll()[0];
    const queryFn = query.options.queryFn as (ctx: any) => Promise<any>;
    const data = await queryFn({} as any);
    expect(data).toEqual([]);
  });

  it('loads gate feed and subscribes to visitor changes', async () => {
    const chain = createVisitorHistoryChain({ data: [visitor], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useLiveGateFeed('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.order).toHaveBeenCalledWith('requested_at', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(40);
    expect(mockChannel).toHaveBeenCalledWith('gate-feed-soc-1');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'visitors', filter: 'society_id=eq.soc-1' },
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalled();
    expect(result.current.data).toEqual([visitor]);
  });

  it('throws error when gate feed fetch fails and unmounts clean channel', async () => {
    const chain = createVisitorHistoryChain({ data: null, error: { message: 'Gate Feed DB Error' } } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result, unmount } = renderHook(() => useLiveGateFeed('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Gate Feed DB Error');

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it('updates cache dynamically on realtime postgres changes', async () => {
    const visitor2 = { ...visitor, id: 'visitor-2-temp' };
    const chain = createVisitorHistoryChain({ data: [visitor, visitor2], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { queryClient, wrapper } = createMutationWrapper();
    const feedKey = ['gate-feed', 'soc-1'];
    queryClient.setQueryData(feedKey, [visitor, visitor2]);

    const { result } = renderHook(() => useLiveGateFeed('soc-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const onCall = mockOn.mock.calls.find((call) => call[0] === 'postgres_changes');
    const handler = onCall?.[2] as ((payload: any) => void) | undefined;
    expect(handler).toBeDefined();

    const updatedVisitor = { ...visitor, status: 'entered' };
    await act(async () => {
      handler?.({
        eventType: 'UPDATE',
        new: updatedVisitor,
        old: visitor,
      });
    });
    expect(queryClient.getQueryData(feedKey)).toEqual([updatedVisitor, visitor2]);

    const newVisitor = { id: 'visitor-2', society_id: 'soc-1', visitor_name: 'Amit', requested_at: '2026-07-16T11:00:00.000Z' };
    await act(async () => {
      handler?.({
        eventType: 'INSERT',
        new: newVisitor,
        old: null,
      });
    });
    expect(queryClient.getQueryData(feedKey)).toEqual([newVisitor, updatedVisitor, visitor2]);

    await act(async () => {
      handler?.({
        eventType: 'DELETE',
        new: null,
        old: { id: 'visitor-1', society_id: 'soc-1' },
      });
    });
    expect(queryClient.getQueryData(feedKey)).toEqual([newVisitor, visitor2]);

    const mismatchedVisitor = { id: 'visitor-3', society_id: 'soc-other', visitor_name: 'Mismatched' };
    await act(async () => {
      handler?.({
        eventType: 'INSERT',
        new: mismatchedVisitor,
        old: null,
      });
    });
    expect(queryClient.getQueryData(feedKey)).toEqual([newVisitor, visitor2]);
  });

  it('handles null database responses and empty query cache fallback for realtime updates', async () => {
    // 1. null database response in useAdminVisitorHistory
    const chainNull = createVisitorHistoryChain({ data: null, error: null } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chainNull) });

    const { result: histRes } = renderHook(() => useAdminVisitorHistory('soc-1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(histRes.current.isSuccess).toBe(true));
    expect(histRes.current.data).toEqual([]);

    // 2. null database response in useLiveGateFeed
    const chainNullFeed = createVisitorHistoryChain({ data: null, error: null } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chainNullFeed) });

    const { result: feedRes } = renderHook(() => useLiveGateFeed('soc-1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(feedRes.current.isSuccess).toBe(true));
    expect(feedRes.current.data).toEqual([]);

    // 3. realtime handler empty cache (old is undefined)
    const { queryClient, wrapper } = createMutationWrapper();
    const chainErr = createVisitorHistoryChain({ data: null, error: { message: 'Gate Feed DB Error' } } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chainErr) });

    const { result: liveRes } = renderHook(() => useLiveGateFeed('soc-1'), { wrapper });
    await waitFor(() => expect(liveRes.current.isError).toBe(true));

    const onCall = mockOn.mock.calls.filter((call) => call[0] === 'postgres_changes').pop();
    const handler = onCall?.[2] as ((payload: any) => void) | undefined;
    expect(handler).toBeDefined();

    const feedKey = ['gate-feed', 'soc-1'];
    const newVisitor = { id: 'visitor-4', society_id: 'soc-1', visitor_name: 'Bob', requested_at: '2026-07-16T12:00:00.000Z' };

    await act(async () => {
      handler?.({
        eventType: 'INSERT',
        new: newVisitor,
        old: null,
      });
    });
    expect(queryClient.getQueryData(feedKey)).toEqual([newVisitor]);
  });
});
