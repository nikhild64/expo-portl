import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  useAmenityBookings,
  useCancelAmenityBooking,
  useCancelledAmenityBookings,
  useCreateAmenityBooking,
  useFailAmenityBooking,
  useMyAmenityBookings,
} from './useAmenityBookings';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
} from './__testUtils/queryTestUtils';

const mockFrom = jest.fn<any>();
const mockUseAuthStore = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: any) => any) => mockUseAuthStore(selector),
}));

const authState = { session: { user: { id: 'user-1' } } };
const bookingDate = new Date('2026-07-16T12:00:00.000Z');

function extendSelectChain<T>(
  result: { data: T; error: null } | { data: null; error: { message: string } },
) {
  const chain = createSelectChain(result) as ReturnType<typeof createSelectChain> & {
    gte: jest.Mock;
    gt: jest.Mock;
    lt: jest.Mock;
  };
  chain.gte = jest.fn().mockReturnValue(chain);
  chain.gt = jest.fn().mockReturnValue(chain);
  chain.lt = jest.fn().mockReturnValue(chain);
  return chain;
}

describe('useAmenityBookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) => selector(authState));
  });

  it('does not fetch when amenityId or date is missing', () => {
    const { result } = renderHook(() => useAmenityBookings(undefined, undefined), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads availability rows for an amenity on a given day', async () => {
    const rows = [{ amenity_id: 'amenity-1', start_at: '2026-07-16T10:00:00.000Z', end_at: '2026-07-16T11:00:00.000Z', status: 'confirmed' }];
    const chain = extendSelectChain({ data: rows, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAmenityBookings('amenity-1', bookingDate), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('amenity_availability');
    expect(chain.eq).toHaveBeenCalledWith('amenity_id', 'amenity-1');
    expect(chain.lt).toHaveBeenCalledWith('start_at', expect.any(String));
    expect(chain.gt).toHaveBeenCalledWith('end_at', expect.any(String));
    expect(result.current.data).toEqual(rows);
  });

  it('loads cancelled bookings for the signed-in user', async () => {
    const cancelled = [{ id: 'booking-1', total_amount: 500, created_at: '2026-07-15T10:00:00.000Z', start_at: '2026-07-16T10:00:00.000Z', end_at: '2026-07-16T11:00:00.000Z', amenities: { name: 'Clubhouse' } }];
    const chain = extendSelectChain({ data: cancelled, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useCancelledAmenityBookings(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('amenity_bookings');
    expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(chain.eq).toHaveBeenCalledWith('status', 'cancelled');
    expect(chain.gte).toHaveBeenCalledWith('created_at', expect.any(String));
    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(result.current.data).toEqual(cancelled);
  });

  it('merges failed payment status into my bookings', async () => {
    const bookingsChain = extendSelectChain({
      data: [{ id: 'booking-1', profile_id: 'user-1', payments: null }],
      error: null,
    });
    const paymentsChain = extendSelectChain({
      data: [{ reference_id: 'booking-1', status: 'failed' }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'amenity_bookings') return { select: jest.fn(() => bookingsChain) };
      if (table === 'payments') return { select: jest.fn(() => paymentsChain) };
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useMyAmenityBookings(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0]?.payments).toEqual({ status: 'failed' });
  });

  it('creates an amenity booking and invalidates caches', async () => {
    const created = { id: 'booking-1', amenity_id: 'amenity-1', profile_id: 'user-1' };
    const single = jest.fn<(...args: any[]) => any>().mockResolvedValue({ data: created, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateAmenityBooking(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ amenity_id: 'amenity-1', profile_id: 'user-1' } as never);
    });

    expect(mockFrom).toHaveBeenCalledWith('amenity_bookings');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['amenity-bookings'] });
  });

  it('marks a booking as failed and invalidates related caches', async () => {
    const eq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useFailAmenityBooking(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('booking-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'booking-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-amenity-bookings'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['amenity-bookings'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['me'] });
  });

  it('cancels a booking and invalidates related caches', async () => {
    const eq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCancelAmenityBooking(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('booking-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'booking-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-amenity-bookings'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['amenity-bookings'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['me'] });
  });
});
