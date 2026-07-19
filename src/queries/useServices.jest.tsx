import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  useDeleteService,
  useServiceProvider,
  useServices,
  useUpsertService,
} from './useServices';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
} from './__testUtils/queryTestUtils';

const mockFrom: any = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

const service = {
  id: 'svc-1',
  society_id: 'soc-1',
  name: 'Quick Plumber',
  category: 'plumber',
  verified: true,
};

describe('useServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useServices(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads services for a society', async () => {
    const chain = createSelectChain({ data: [service], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useServices('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('service_providers');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.order).toHaveBeenCalledWith('verified', { ascending: false });
    expect(chain.order).toHaveBeenCalledWith('name');
    expect(result.current.data).toEqual([service]);
  });

  it('filters services by category when category is not all', async () => {
    const chain = createSelectChain({ data: [service], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useServices('soc-1', 'plumber'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('category', 'plumber');
  });

  it('does not filter by category when category is all', async () => {
    const chain = createSelectChain({ data: [service], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useServices('soc-1', 'all'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).not.toHaveBeenCalledWith('category', expect.any(String));
  });

  it('loads a single service provider by id', async () => {
    const chain = createSelectChain({ data: service, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useServiceProvider('svc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('id', 'svc-1');
    expect(result.current.data).toEqual(service);
  });

  it('inserts a service provider and invalidates the list', async () => {
    const single = jest.fn<(...args: any[]) => any>().mockResolvedValue({ data: service, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpsertService(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        society_id: 'soc-1',
        name: 'Quick Plumber',
        category: 'plumber',
      } as never);
    });

    expect(insert).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services'] });
  });

  it('updates a service provider and invalidates the list', async () => {
    const single = jest.fn<(...args: any[]) => any>().mockResolvedValue({ data: service, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ update });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpsertService(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'svc-1', name: 'Updated Plumber' } as never);
    });

    expect(eq).toHaveBeenCalledWith('id', 'svc-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services'] });
  });

  it('deletes a service provider and invalidates the list', async () => {
    const eq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteService(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('svc-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'svc-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services'] });
  });
});
