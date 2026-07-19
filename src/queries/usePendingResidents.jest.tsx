import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useApproveResident, usePendingApprovals, useRejectResident } from './usePendingResidents';
import { createMutationWrapper, createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom: any = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

describe('usePendingResidents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads pending resident and guard approvals', async () => {
    const chain = createSelectChain({ data: [{ id: 'profile-1', status: 'pending' }], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => usePendingApprovals('soc-1'), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.in).toHaveBeenCalledWith('role', ['resident', 'guard']);
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('approves a resident and invalidates admin queries', async () => {
    const eq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useApproveResident(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('profile-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'profile-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pending-approvals'] });
  });

  it('rejects a resident by removing flat links then blocking the profile', async () => {
    const profileEq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    const flatEq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'flat_residents') {
        return { delete: jest.fn(() => ({ eq: flatEq })) };
      }
      return { update: jest.fn(() => ({ eq: profileEq })) };
    });

    const { result } = renderHook(() => useRejectResident(), { wrapper: createMutationWrapper().wrapper });

    await act(async () => {
      await result.current.mutateAsync('profile-1');
    });

    expect(flatEq).toHaveBeenCalledWith('profile_id', 'profile-1');
    expect(profileEq).toHaveBeenCalledWith('id', 'profile-1');
  });
});
