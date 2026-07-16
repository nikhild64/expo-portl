import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import { useAdminComplaints, useUpdateComplaintAdmin } from './useAdminComplaints';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
  createUpdateChain,
} from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

const societyId = 'soc-1';

describe('useAdminComplaints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', async () => {
    const { result } = renderHook(() => useAdminComplaints(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it('loads complaints for a society ordered by created_at', async () => {
    const complaints = [{ id: 'c-1', title: 'Noise', society_id: societyId }];
    const chain = createSelectChain({ data: complaints, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAdminComplaints(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('complaints');
    expect(chain.eq).toHaveBeenCalledWith('society_id', societyId);
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result.current.data).toEqual(complaints);
  });
});

describe('useUpdateComplaintAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates a complaint and invalidates related caches', async () => {
    const updated = { id: 'c-1', title: 'Noise', status: 'assigned' };
    const updateChain = createUpdateChain({ data: updated, error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateComplaintAdmin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'c-1', patch: { status: 'assigned' } });
    });

    expect(mockFrom).toHaveBeenCalledWith('complaints');
    expect(updateChain.eq).toHaveBeenCalledWith('id', 'c-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-complaints'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['complaints', 'detail', 'c-1'] });
  });

  it('rolls back cache on error and handles mismatch/non-object caches in onMutate', async () => {
    const errorMsg = 'Update DB Error';
    const updateChain = createUpdateChain({ data: null, error: { message: errorMsg } } as any);
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const { queryClient, wrapper } = createMutationWrapper();
    const adminKey = ['admin-complaints', 'soc-1'];
    const originalComplaints = [
      { id: 'c-1', title: 'Noise', status: 'open' },
      { id: 'c-2', title: 'Water', status: 'open' },
    ];
    queryClient.setQueryData(adminKey, originalComplaints);

    const detailKey = ['complaints', 'detail', 'c-1'];
    const originalDetail = { id: 'c-1', title: 'Noise', status: 'open' };
    queryClient.setQueryData(detailKey, originalDetail);

    const detailKeyInvalid = ['complaints', 'detail', 'c-2'];
    queryClient.setQueryData(detailKeyInvalid, 'not-an-object');

    const detailKeyNull = ['complaints', 'detail', 'c-3'];
    queryClient.setQueryData(detailKeyNull, null);

    const { result } = renderHook(() => useUpdateComplaintAdmin(), { wrapper });

    await expect(
      result.current.mutateAsync({ id: 'c-1', patch: { status: 'assigned' } })
    ).rejects.toEqual({ message: errorMsg });

    expect(queryClient.getQueryData(adminKey)).toEqual(originalComplaints);
    expect(queryClient.getQueryData(detailKey)).toEqual(originalDetail);
  });
});

describe('useAdminComplaints queryFn error', () => {
  it('throws error when select query fails', async () => {
    const chain = createSelectChain({ data: null, error: { message: 'DB Error' } } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAdminComplaints(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('DB Error');
  });
});
