import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  useBulkCreateFlats,
  useDeleteFlat,
  useDeleteTower,
  useFlat,
  useFlats,
  useTower,
  useTowers,
  useUpsertFlat,
  useUpsertTower,
} from './useTowers';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
} from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

const tower = { id: 'tower-1', society_id: 'soc-1', name: 'A Block', sort_order: 1 };
const flat = { id: 'flat-1', tower_id: 'tower-1', number: '101', floor: 1 };

describe('useTowers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch towers when societyId is missing', () => {
    const { result } = renderHook(() => useTowers(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads towers for a society', async () => {
    const chain = createSelectChain({ data: [tower], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useTowers('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('towers');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.order).toHaveBeenCalledWith('sort_order');
    expect(chain.order).toHaveBeenCalledWith('name');
    expect(result.current.data).toEqual([tower]);
  });

  it('loads a tower with flats', async () => {
    const chain = createSelectChain({ data: { ...tower, flats: [flat] }, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useTower('tower-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('id', 'tower-1');
    expect(chain.single).toHaveBeenCalled();
  });

  it('loads flats for a tower', async () => {
    const chain = createSelectChain({ data: [flat], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFlats('tower-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('flats');
    expect(chain.eq).toHaveBeenCalledWith('tower_id', 'tower-1');
    expect(chain.order).toHaveBeenCalledWith('floor');
    expect(chain.order).toHaveBeenCalledWith('number');
    expect(result.current.data).toEqual([flat]);
  });

  it('loads a single flat by id', async () => {
    const chain = createSelectChain({ data: flat, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFlat('flat-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('id', 'flat-1');
    expect(chain.single).toHaveBeenCalled();
    expect(result.current.data).toEqual(flat);
  });

  it('inserts a tower and invalidates the list', async () => {
    const single = jest.fn().mockResolvedValue({ data: tower, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpsertTower(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ society_id: 'soc-1', name: 'A Block' } as never);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['towers'] });
  });

  it('deletes a tower and invalidates the list', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteTower(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('tower-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'tower-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['towers'] });
  });

  it('inserts a flat and invalidates the list', async () => {
    const single = jest.fn().mockResolvedValue({ data: flat, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpsertFlat(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ tower_id: 'tower-1', number: '101' } as never);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['flats'] });
  });

  it('bulk creates flats and invalidates the list', async () => {
    const select = jest.fn().mockResolvedValue({ data: [flat], error: null });
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useBulkCreateFlats(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync([{ tower_id: 'tower-1', number: '101' }] as never);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['flats'] });
  });

  it('deletes a flat and invalidates the list', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteFlat(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('flat-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'flat-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['flats'] });
  });
});
