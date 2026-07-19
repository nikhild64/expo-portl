import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  useAdminAmenities,
  useAdminAmenityBookings,
  useDeleteAmenity,
  useUpsertAmenity,
} from './useAmenityMutations';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
} from './__testUtils/queryTestUtils';

const mockFrom: any = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

const amenity = { id: 'amenity-1', society_id: 'soc-1', name: 'Clubhouse', active: true };

describe('useAmenityMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads all amenities for admin without active filter', async () => {
    const chain = createSelectChain({ data: [amenity], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAdminAmenities('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('amenities');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.order).toHaveBeenCalledWith('name');
    expect(result.current.data).toEqual([amenity]);
  });

  it('loads admin amenity bookings for an amenity', async () => {
    const bookings = [{ id: 'booking-1', amenity_id: 'amenity-1', status: 'confirmed' }];
    const chain = createSelectChain({ data: bookings, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAdminAmenityBookings('amenity-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('amenity_bookings');
    expect(chain.eq).toHaveBeenCalledWith('amenity_id', 'amenity-1');
    expect(chain.order).toHaveBeenCalledWith('start_at', { ascending: true });
    expect(result.current.data).toEqual(bookings);
  });

  it('inserts an amenity and invalidates caches', async () => {
    const single = jest.fn<(...args: any[]) => any>().mockResolvedValue({ data: amenity, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpsertAmenity(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ society_id: 'soc-1', name: 'Clubhouse' } as never);
    });

    expect(insert).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-amenities'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['amenities'] });
  });

  it('updates an amenity and invalidates caches', async () => {
    const single = jest.fn<(...args: any[]) => any>().mockResolvedValue({ data: amenity, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ update });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpsertAmenity(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'amenity-1', name: 'Updated Clubhouse' } as never);
    });

    expect(eq).toHaveBeenCalledWith('id', 'amenity-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-amenities'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['amenities'] });
  });

  it('deletes an amenity and invalidates caches', async () => {
    const eq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteAmenity(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('amenity-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'amenity-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-amenities'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['amenities'] });
  });
});
