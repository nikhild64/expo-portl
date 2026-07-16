import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import {
  useAdminResidents,
  useAssignResidentFlat,
  useRemoveResidentFlat,
  useResidentDetail,
  useUpdateResident,
} from './useAdminResidents';
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

jest.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}));

function createResidentListChain<T>(result: { data: T; error: null }) {
  const chain: {
    eq: jest.Mock;
    ilike: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    select: jest.Mock;
  } = {
    eq: jest.fn(),
    ilike: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
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

const resident = {
  id: 'resident-1',
  full_name: 'Asha',
  role: 'resident',
  status: 'active',
  society_id: 'soc-1',
  flat_residents: [],
};

describe('useAdminResidents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useAdminResidents(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads residents with status and search filters', async () => {
    const chain = createResidentListChain({ data: [resident], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAdminResidents('soc-1', { status: 'active', search: 'Asha' }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.eq).toHaveBeenCalledWith('role', 'resident');
    expect(chain.eq).toHaveBeenCalledWith('status', 'active');
    expect(chain.ilike).toHaveBeenCalledWith('full_name', '%Asha%');
    expect(result.current.data).toEqual([resident]);
  });

  it('throws error when database query fails in useAdminResidents', async () => {
    const chain = createResidentListChain({ data: null, error: new Error('Query failed') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAdminResidents('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useResidentDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads a resident profile by id', async () => {
    const chain = createSelectChain({ data: resident, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useResidentDetail('resident-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('id', 'resident-1');
    expect(result.current.data).toEqual(resident);
  });

  it('throws error when database query fails in useResidentDetail', async () => {
    const chain = createSelectChain({ data: null, error: new Error('Query failed') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useResidentDetail('resident-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateResident', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates a resident and invalidates resident caches', async () => {
    const updated = { ...resident, status: 'blocked' };
    const updateChain = createUpdateChain({ data: updated, error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateResident(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'resident-1', patch: { status: 'blocked' } });
    });

    expect(updateChain.eq).toHaveBeenCalledWith('id', 'resident-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-residents'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-residents', 'detail', 'resident-1'] });
  });

  it('throws error when database update fails in useUpdateResident', async () => {
    const updateChain = createUpdateChain({ data: null, error: new Error('Update failed') } as any);
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useUpdateResident(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ id: 'resident-1', patch: { status: 'blocked' } })).rejects.toThrow('Update failed');
    });
  });
});

describe('useAssignResidentFlat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts a flat assignment and invalidates resident caches', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAssignResidentFlat(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        profileId: 'resident-1',
        flatId: 'flat-1',
        isHead: true,
        isOwner: false,
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('flat_residents');
    expect(upsert).toHaveBeenCalledWith({
      flat_id: 'flat-1',
      is_head: true,
      is_owner: false,
      profile_id: 'resident-1',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-residents'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-residents', 'detail', 'resident-1'] });
  });

  it('throws error when database upsert fails in useAssignResidentFlat', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: new Error('Upsert failed') });
    mockFrom.mockReturnValue({ upsert });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useAssignResidentFlat(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({
        profileId: 'resident-1',
        flatId: 'flat-1',
      })).rejects.toThrow('Upsert failed');
    });
  });
});

describe('useRemoveResidentFlat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes a flat assignment and invalidates resident caches', async () => {
    const flatEq = jest.fn().mockResolvedValue({ error: null });
    const profileEq = jest.fn().mockReturnValue({ eq: flatEq });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq: profileEq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useRemoveResidentFlat(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ profileId: 'resident-1', flatId: 'flat-1' });
    });

    expect(mockFrom).toHaveBeenCalledWith('flat_residents');
    expect(profileEq).toHaveBeenCalledWith('profile_id', 'resident-1');
    expect(flatEq).toHaveBeenCalledWith('flat_id', 'flat-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-residents'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-residents', 'detail', 'resident-1'] });
  });

  it('throws error when database delete fails in useRemoveResidentFlat', async () => {
    const flatEq = jest.fn().mockResolvedValue({ error: new Error('Delete failed') });
    const profileEq = jest.fn().mockReturnValue({ eq: flatEq });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq: profileEq })) });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useRemoveResidentFlat(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ profileId: 'resident-1', flatId: 'flat-1' })).rejects.toThrow('Delete failed');
    });
  });
});
