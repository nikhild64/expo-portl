import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  useCancelVisitorRequest,
  useMarkEntered,
  useMarkExit,
  useVisitorLog,
} from './useVisitorLog';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
} from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();
const mockEnqueueIfOffline = jest.fn<(...args: unknown[]) => Promise<boolean>>();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/lib/offlineQueue', () => ({
  enqueueIfOffline: (payload: unknown) => mockEnqueueIfOffline(payload),
}));

jest.mock('@/lib/guardQueries', () => ({
  invalidateGuardActivity: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('@/lib/format', () => ({
  visitorLogRangeBounds: () => ({
    start: '2026-07-16T00:00:00.000Z',
    end: '2026-07-16T23:59:59.999Z',
  }),
}));

function extendSelectChain<T>(
  result: { data: T; error: null } | { data: null; error: { message: string } },
) {
  const chain = createSelectChain(result) as ReturnType<typeof createSelectChain> & {
    or: jest.Mock;
  };
  chain.or = jest.fn().mockReturnValue(chain);
  return chain;
}

const visitorRow = {
  id: 'visitor-1',
  flat_id: 'flat-1',
  visitor_name: 'Alex Guest',
  visitor_phone: null,
  visitor_photo_path: null,
  type: 'guest',
  status: 'entered',
  requested_at: '2026-07-16T10:00:00.000Z',
  entered_at: '2026-07-16T10:30:00.000Z',
  exited_at: null,
  flats: { number: '101', tower_id: 'tower-1', towers: { name: 'A Block' } },
};

describe('useVisitorLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueIfOffline.mockResolvedValue(false);
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useVisitorLog(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads visitor log rows for a society', async () => {
    const chain = extendSelectChain({ data: [visitorRow], error: null });
    const select = jest.fn(() => chain);
    mockFrom.mockReturnValue({ select });

    const { result } = renderHook(() => useVisitorLog('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(select).toHaveBeenCalledWith(
      'id, flat_id, visitor_name, visitor_phone, visitor_photo_path, type, status, requested_at, entered_at, exited_at, flats(number, tower_id, towers(name))',
    );
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.or).toHaveBeenCalledWith(
      'and(requested_at.gte.2026-07-16T00:00:00.000Z,requested_at.lte.2026-07-16T23:59:59.999Z),and(entered_at.gte.2026-07-16T00:00:00.000Z,entered_at.lte.2026-07-16T23:59:59.999Z)',
    );
    expect(chain.order).toHaveBeenCalledWith('requested_at', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(100);
    expect(result.current.data).toEqual([visitorRow]);
  });

  it('filters by tower when towerId is provided', async () => {
    const chain = extendSelectChain({ data: [], error: null });
    const select = jest.fn(() => chain);
    mockFrom.mockReturnValue({ select });

    const { result } = renderHook(() => useVisitorLog('soc-1', 'tower-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(select).toHaveBeenCalledWith(
      'id, flat_id, visitor_name, visitor_phone, visitor_photo_path, type, status, requested_at, entered_at, exited_at, flats!inner(number, tower_id, towers(name))',
    );
    expect(chain.eq).toHaveBeenCalledWith('flats.tower_id', 'tower-1');
  });

  it('cancels a visitor request and invalidates caches', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCancelVisitorRequest(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('visitor-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'visitor-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['visitors'] });
  });

  it('marks a visitor exit and optimistically updates caches', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const logKey = ['visitor-log', 'soc-1', null, 'today'];
    queryClient.setQueryData(logKey, [visitorRow]);

    const { result } = renderHook(() => useMarkExit(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('visitor-1');
    });

    const updated = queryClient.getQueryData<typeof visitorRow[]>(logKey);
    expect(updated?.[0]?.status).toBe('exited');
    expect(updated?.[0]?.exited_at).toEqual(expect.any(String));
  });

  it('marks a visitor as entered', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const logKey = ['visitor-log', 'soc-1', null, 'today'];
    queryClient.setQueryData(logKey, [{ ...visitorRow, status: 'approved', entered_at: null }]);

    const { result } = renderHook(() => useMarkEntered('visitor-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    const updated = queryClient.getQueryData<typeof visitorRow[]>(logKey);
    expect(updated?.[0]?.status).toBe('entered');
    expect(updated?.[0]?.entered_at).toEqual(expect.any(String));
  });

  it('does not call supabase and returns early if offline when marking exit', async () => {
    mockEnqueueIfOffline.mockResolvedValue(true);
    const update = jest.fn();
    mockFrom.mockReturnValue({ update });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useMarkExit(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('visitor-1');
    });

    expect(mockEnqueueIfOffline).toHaveBeenCalledWith({
      type: 'mark_exit',
      payload: { visitorId: 'visitor-1' },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('rolls back cache on supabase error when marking exit', async () => {
    const errorMsg = 'DB Error';
    const eq = jest.fn().mockResolvedValue({ error: { message: errorMsg } });
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const logKey = ['visitor-log', 'soc-1', null, 'today'];
    queryClient.setQueryData(logKey, [visitorRow]);

    const detailKey = ['visitors', 'detail', 'visitor-1'];
    queryClient.setQueryData(detailKey, visitorRow);

    const { result } = renderHook(() => useMarkExit(), { wrapper });

    await expect(
      result.current.mutateAsync('visitor-1')
    ).rejects.toEqual({ message: errorMsg });

    expect(queryClient.getQueryData<typeof visitorRow>(detailKey)).toEqual(visitorRow);
    expect(queryClient.getQueryData<typeof visitorRow[]>(logKey)).toEqual([visitorRow]);
  });

  it('throws an error and returns undefined early if visitorId is missing in useMarkEntered', async () => {
    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useMarkEntered(undefined), { wrapper });

    await expect(
      result.current.mutateAsync()
    ).rejects.toThrow('Visitor not found');
  });

  it('rolls back cache on supabase error when marking entered', async () => {
    const errorMsg = 'DB Error';
    const eq = jest.fn().mockResolvedValue({ error: { message: errorMsg } });
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const logKey = ['visitor-log', 'soc-1', null, 'today'];
    queryClient.setQueryData(logKey, [visitorRow]);

    const detailKey = ['visitors', 'detail', 'visitor-1'];
    queryClient.setQueryData(detailKey, visitorRow);

    const verifyKey = ['visitors', 'verify', 'visitor-1'];
    queryClient.setQueryData(verifyKey, { status: 'approved' });

    const { result } = renderHook(() => useMarkEntered('visitor-1'), { wrapper });

    await expect(
      result.current.mutateAsync()
    ).rejects.toEqual({ message: errorMsg });

    expect(queryClient.getQueryData(detailKey)).toEqual(visitorRow);
    expect(queryClient.getQueryData(logKey)).toEqual([visitorRow]);
    expect(queryClient.getQueryData(verifyKey)).toEqual({ status: 'approved' });
  });

  it('handles empty query cache safely in optimistic updates', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const logKey = ['visitor-log', 'soc-1', null, 'today'];
    queryClient.setQueryData(logKey, [visitorRow, { ...visitorRow, id: 'visitor-2' }]);

    const verifyKey = ['visitors', 'verify', 'visitor-1'];
    queryClient.setQueryData(verifyKey, 'not-an-object');

    const { result } = renderHook(() => useMarkEntered('visitor-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(verifyKey)).toBe('not-an-object');
  });

  it('handles null societyId refetch and queryFn failures in useVisitorLog', async () => {
    // 1. null societyId early return
    const { queryClient, wrapper } = createMutationWrapper();
    renderHook(() => useVisitorLog(null), { wrapper });
    const query = queryClient.getQueryCache().getAll()[0];
    const data = await query.options.queryFn({} as any);
    expect(data).toEqual([]);

    // 2. queryFn failure
    const chain = extendSelectChain({ data: null, error: { message: 'Visitor DB Error' } } as any);
    const select = jest.fn(() => chain);
    mockFrom.mockReturnValue({ select });

    const { result: logResErr } = renderHook(() => useVisitorLog('soc-1'), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(logResErr.current.isError).toBe(true));
    expect(logResErr.current.error?.message).toBe('Visitor DB Error');
  });

  it('throws error when useCancelVisitorRequest fails', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'Cancel Error' } });
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useCancelVisitorRequest(), { wrapper });

    await expect(result.current.mutateAsync('visitor-1')).rejects.toEqual({ message: 'Cancel Error' });
  });
});
