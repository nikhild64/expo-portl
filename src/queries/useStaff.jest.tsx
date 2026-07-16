import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useDeleteStaff, useStaff, useStaffMember, useUpsertStaff } from './useStaff';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
} from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

const staffMember = {
  id: 'staff-1',
  society_id: 'soc-1',
  name: 'Ravi Guard',
  role: 'guard',
  active: true,
};

describe('useStaff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useStaff(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads staff for a society ordered by active then name', async () => {
    const chain = createSelectChain({ data: [staffMember], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useStaff('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('staff');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.order).toHaveBeenCalledWith('active', { ascending: false });
    expect(chain.order).toHaveBeenCalledWith('name');
    expect(result.current.data).toEqual([staffMember]);
  });

  it('filters staff by role when role is not all', async () => {
    const chain = createSelectChain({ data: [staffMember], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useStaff('soc-1', 'guard'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('role', 'guard');
  });

  it('loads a single staff member by id', async () => {
    const chain = createSelectChain({ data: staffMember, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useStaffMember('staff-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('id', 'staff-1');
    expect(chain.single).toHaveBeenCalled();
    expect(result.current.data).toEqual(staffMember);
  });

  it('inserts staff and invalidates the list', async () => {
    const single = jest.fn().mockResolvedValue({ data: staffMember, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpsertStaff(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ society_id: 'soc-1', name: 'Ravi Guard' } as never);
    });

    expect(insert).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff'] });
  });

  it('updates staff and invalidates the list', async () => {
    const single = jest.fn().mockResolvedValue({ data: staffMember, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ update });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpsertStaff(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'staff-1', name: 'Updated Guard' } as never);
    });

    expect(eq).toHaveBeenCalledWith('id', 'staff-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff'] });
  });

  it('deletes staff and invalidates the list', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteStaff(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('staff-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'staff-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['staff'] });
  });
});
