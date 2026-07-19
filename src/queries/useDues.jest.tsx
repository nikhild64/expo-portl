import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  useCapturedAmenityPayments,
  useDuesHistory,
  useDuesOutstanding,
  useFailedPayments,
  usePendingPayments,
} from './useDues';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn<any>();
const mockUseAuthStore = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: any) => any) => mockUseAuthStore(selector),
}));

const authState = { session: { user: { id: 'user-1' } } };
const flatIds = ['flat-1', 'flat-2'];

describe('useDuesOutstanding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) => selector(authState));
  });

  it('does not fetch when flatIds are missing', () => {
    const { result } = renderHook(() => useDuesOutstanding(undefined), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads outstanding dues for the given flats', async () => {
    const dues = [{ id: 'due-1', flat_id: 'flat-1', status: 'due', period: '2026-07' }];
    const chain = createSelectChain({ data: dues, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useDuesOutstanding(flatIds), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('dues');
    expect(chain.in).toHaveBeenCalledWith('flat_id', flatIds);
    expect(chain.in).toHaveBeenCalledWith('status', ['due', 'overdue', 'partial']);
    expect(chain.order).toHaveBeenCalledWith('period', { ascending: true });
    expect(result.current.data).toEqual(dues);
  });
});

describe('useDuesHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) => selector(authState));
  });

  it('loads paid dues history for the given flats', async () => {
    const dues = [{ id: 'due-1', flat_id: 'flat-1', status: 'paid', period: '2026-06' }];
    const chain = createSelectChain({ data: dues, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useDuesHistory(flatIds), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('dues');
    expect(chain.in).toHaveBeenCalledWith('flat_id', flatIds);
    expect(chain.eq).toHaveBeenCalledWith('status', 'paid');
    expect(chain.order).toHaveBeenCalledWith('period', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(12);
    expect(result.current.data).toEqual(dues);
  });
});

describe('usePendingPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) => selector(authState));
  });

  it('does not fetch when the user is not signed in', () => {
    mockUseAuthStore.mockImplementation((selector: any) => selector({ session: null }));

    const { result } = renderHook(() => usePendingPayments(), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads pending payments for the signed-in user', async () => {
    const payments = [
      {
        id: 'pay-1',
        profile_id: 'user-1',
        status: 'created',
        purpose: 'dues',
        reference_id: 'due-1',
        reference_ids: null,
      },
    ];
    const paymentsChain = createSelectChain({ data: payments, error: null });
    const duesChain = createSelectChain({ data: [{ id: 'due-1', period: '2026-07' }], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'payments') return { select: jest.fn(() => paymentsChain) };
      if (table === 'dues') return { select: jest.fn(() => duesChain) };
      throw new Error(`Unexpected table ${table}`);
    });

    const { result } = renderHook(() => usePendingPayments(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(paymentsChain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(paymentsChain.eq).toHaveBeenCalledWith('status', 'created');
    expect(paymentsChain.limit).toHaveBeenCalledWith(10);
    expect(result.current.data?.[0]?.label).toBe('2026-07');
  });
});

describe('useFailedPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) => selector(authState));
  });

  it('loads failed payments with labels for the signed-in user', async () => {
    const payments = [
      {
        id: 'pay-1',
        profile_id: 'user-1',
        status: 'failed',
        purpose: 'other',
        reference_id: null,
        reference_ids: null,
      },
    ];
    const chain = createSelectChain({ data: payments, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFailedPayments(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(chain.eq).toHaveBeenCalledWith('status', 'failed');
    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(result.current.data?.[0]?.label).toBe('Other');
  });
});

describe('useCapturedAmenityPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) => selector(authState));
  });

  it('loads captured amenity payments for the signed-in user', async () => {
    const payments = [
      {
        id: 'pay-1',
        profile_id: 'user-1',
        status: 'captured',
        purpose: 'amenity',
        reference_id: 'booking-1',
        reference_ids: null,
      },
    ];
    const paymentsChain = createSelectChain({ data: payments, error: null });
    const bookingsChain = createSelectChain({
      data: [{ id: 'booking-1', amenities: { name: 'Clubhouse' } }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'payments') return { select: jest.fn(() => paymentsChain) };
      if (table === 'amenity_bookings') return { select: jest.fn(() => bookingsChain) };
      throw new Error(`Unexpected table ${table}`);
    });

    const { result } = renderHook(() => useCapturedAmenityPayments(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(paymentsChain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(paymentsChain.eq).toHaveBeenCalledWith('purpose', 'amenity');
    expect(paymentsChain.eq).toHaveBeenCalledWith('status', 'captured');
    expect(result.current.data?.[0]?.label).toBe('Clubhouse');
  });
});
