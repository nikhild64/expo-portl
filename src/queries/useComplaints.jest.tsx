import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { InfiniteData } from '@tanstack/react-query';

import { useCloseComplaint, useComplaintCounts, useCreateComplaint, useComplaints, useComplaint, flattenComplaintPages } from './useComplaints';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
  createUpdateChain,
} from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();
const mockUseAuthStore = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (state: unknown) => unknown) => mockUseAuthStore(selector),
    {
      getState: () =>
        mockUseAuthStore((state) => state) as { session: { user: { id: string } } | null },
    },
  ),
}));

jest.mock('@/lib/format', () => ({
  startOfCurrentMonthIso: () => '2026-07-01T00:00:00.000Z',
}));

const authState = { session: { user: { id: 'user-1' } } };
const societyId = 'soc-1';

describe('useComplaintCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => selector(authState));
  });

  it('does not fetch society counts without a society id', () => {
    const { result } = renderHook(() => useComplaintCounts('society', null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('aggregates active, resolved, and resolved-this-month counts for a society', async () => {
    const rows = [
      { status: 'new', resolved_at: null },
      { status: 'in_progress', resolved_at: null },
      { status: 'closed', resolved_at: '2026-07-10T12:00:00.000Z' },
      { status: 'resolved', resolved_at: '2026-06-15T12:00:00.000Z' },
    ];
    const chain = createSelectChain({ data: rows, error: null });
    const select = jest.fn(() => chain);
    mockFrom.mockReturnValue({ select });

    const { result } = renderHook(() => useComplaintCounts('society', societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('complaints');
    expect(select).toHaveBeenCalledWith('status, resolved_at');
    expect(chain.eq).toHaveBeenCalledWith('society_id', societyId);
    expect(result.current.data).toEqual({
      all: 4,
      active: 2,
      resolved: 2,
      resolvedThisMonth: 1,
    });
  });

  it('scopes mine counts to the signed-in user', async () => {
    const chain = createSelectChain({ data: [], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useComplaintCounts('mine'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('raised_by', 'user-1');
    expect(chain.eq).not.toHaveBeenCalledWith('society_id', expect.any(String));
  });
});

describe('useCreateComplaint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => selector(authState));
  });

  it('creates a complaint and refreshes list, detail, and count caches', async () => {
    const created = { id: 'complaint-1', title: 'Leaking pipe', status: 'new' };
    const single = jest.fn().mockResolvedValue({ data: created, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateComplaint(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        title: 'Leaking pipe',
        society_id: societyId,
        raised_by: 'user-1',
      } as never);
    });

    expect(mockFrom).toHaveBeenCalledWith('complaints');
    expect(insert).toHaveBeenCalled();
    expect(queryClient.getQueryData(['complaints', 'detail', 'complaint-1'])).toEqual(created);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['complaints'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['complaint-counts'] });
  });
});

describe('useCloseComplaint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => selector(authState));
  });

  it('closes a complaint with resolved metadata', async () => {
    const closed = { id: 'complaint-1', status: 'closed', resolved_at: '2026-07-16T10:00:00.000Z' };
    const updateChain = createUpdateChain({ data: closed, error: null });
    const update = jest.fn(() => updateChain);
    mockFrom.mockReturnValue({ update });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useCloseComplaint(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('complaint-1');
    });

    expect(mockFrom).toHaveBeenCalledWith('complaints');
    expect(update).toHaveBeenCalledWith({
      resolved_at: expect.any(String),
      status: 'closed',
    });
    expect(updateChain.eq).toHaveBeenCalledWith('id', 'complaint-1');
  });

  it('rolls back optimistic list and detail cache updates when close fails', async () => {
    const updateChain = createUpdateChain({ data: null, error: { message: 'RLS denied' } });
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const complaint = { id: 'complaint-1', status: 'in_progress' as const, title: 'Noise' };
    const listKey = ['complaints', 'mine', 'active', 'all', 'user-1', undefined] as const;
    const previousList: InfiniteData<{ items: typeof complaint[]; nextPage: undefined }> = {
      pages: [{ items: [complaint], nextPage: undefined }],
      pageParams: [0],
    };

    const { queryClient, wrapper } = createMutationWrapper();
    queryClient.setQueryData(listKey, previousList);
    queryClient.setQueryData(['complaints', 'detail', 'complaint-1'], complaint);

    const { result } = renderHook(() => useCloseComplaint(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('complaint-1')).rejects.toBeDefined();
    });

    expect(queryClient.getQueryData(listKey)).toEqual(previousList);
    expect(queryClient.getQueryData(['complaints', 'detail', 'complaint-1'])).toEqual(complaint);
  });
});

describe('flattenComplaintPages', () => {
  it('flattens infinite query pages into a single list', () => {
    expect(
      flattenComplaintPages([
        { items: [{ id: '1' }], nextPage: 1 },
        { items: [{ id: '2' }], nextPage: undefined },
      ] as never),
    ).toEqual([{ id: '1' }, { id: '2' }]);
    expect(flattenComplaintPages(undefined)).toEqual([]);
  });
});

describe('useComplaints list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => selector(authState));
  });

  it('loads the first page of society complaints', async () => {
    const complaints = [{ id: 'complaint-1', title: 'Noise', status: 'new' }];
    const chain = createSelectChain({ data: complaints, error: null });
    chain.range = jest.fn().mockResolvedValue({ data: complaints, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(
      () => useComplaints({ scope: 'society', societyId, statusFilter: 'active' }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('complaints');
    expect(chain.eq).toHaveBeenCalledWith('society_id', societyId);
    expect(result.current.data?.pages[0]?.items).toEqual(complaints);
  });
});

describe('useComplaint detail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => selector(authState));
  });

  it('loads a complaint by id', async () => {
    const complaint = { id: 'complaint-1', title: 'Noise', status: 'new' };
    const chain = createSelectChain({ data: complaint, error: null });
    chain.single = jest.fn().mockResolvedValue({ data: complaint, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useComplaint('complaint-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(complaint);
  });
});
