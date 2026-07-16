import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import {
  useAdminActivity,
  useAmenityUsageKpi,
  useDuesCollectedKpi,
  useOpenComplaintsKpi,
  usePendingJoinRequests,
  useTodayVisitorsKpi,
} from './useAdminDashboard';
import { createQueryWrapper } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

function createFilterChain<T>(result: { data: T; error: null }) {
  const chain: {
    eq: jest.Mock;
    in: jest.Mock;
    gte: jest.Mock;
    lte: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    select: jest.Mock;
  } = {
    eq: jest.fn(),
    in: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.gte.mockReturnValue(chain);
  chain.lte.mockReturnValue(chain);
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

const societyId = 'soc-1';

describe('useTodayVisitorsKpi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useTodayVisitorsKpi(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('aggregates visitor counts into today, previous, and trend buckets', async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const chain = createFilterChain({
      data: [
        { requested_at: today.toISOString() },
        { requested_at: yesterday.toISOString() },
      ],
      error: null,
    });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useTodayVisitorsKpi(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(chain.eq).toHaveBeenCalledWith('society_id', societyId);
    expect(chain.gte).toHaveBeenCalled();
    expect(chain.lte).toHaveBeenCalled();
    expect(result.current.data?.count).toBe(1);
    expect(result.current.data?.previous).toBe(1);
    expect(result.current.data?.trend).toHaveLength(7);
  });

  it('throws error when database query fails in useTodayVisitorsKpi', async () => {
    const chain = createFilterChain({ data: null, error: new Error('Query failed') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useTodayVisitorsKpi(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Query failed'));
  });
});

describe('useOpenComplaintsKpi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useOpenComplaintsKpi(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('counts open complaints by priority', async () => {
    const chain = createFilterChain({
      data: [{ priority: 'low' }, { priority: 'high' }, { priority: 'high' }],
      error: null,
    });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useOpenComplaintsKpi(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('complaints');
    expect(chain.in).toHaveBeenCalledWith('status', ['new', 'assigned', 'in_progress']);
    expect(result.current.data).toEqual({
      count: 3,
      breakdown: { low: 1, medium: 0, high: 2, urgent: 0 },
    });
  });

  it('throws error when database query fails in useOpenComplaintsKpi', async () => {
    const chain = createFilterChain({ data: null, error: new Error('Query failed') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useOpenComplaintsKpi(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDuesCollectedKpi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useDuesCollectedKpi(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('calculates collected dues percentage for the month', async () => {
    const chain = createFilterChain({
      data: [
        { total: 1000, status: 'paid' },
        { total: 500, status: 'due' },
      ],
      error: null,
    });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useDuesCollectedKpi(societyId, new Date('2026-07-15')), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('dues');
    expect(chain.eq).toHaveBeenCalledWith('society_id', societyId);
    expect(chain.gte).toHaveBeenCalled();
    expect(chain.lte).toHaveBeenCalled();
    expect(result.current.data).toEqual({ collected: 1000, total: 1500, percent: 67 });
  });

  it('throws error when database query fails in useDuesCollectedKpi', async () => {
    const chain = createFilterChain({ data: null, error: new Error('Query failed') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useDuesCollectedKpi(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useAmenityUsageKpi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useAmenityUsageKpi(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('buckets amenity bookings into daily usage percentages', async () => {
    const startAt = new Date();
    startAt.setHours(12, 0, 0, 0);
    const chain = createFilterChain({
      data: [{ start_at: startAt.toISOString(), amenities: { society_id: societyId } }],
      error: null,
    });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAmenityUsageKpi(societyId, 3), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('amenity_bookings');
    expect(chain.eq).toHaveBeenCalledWith('amenities.society_id', societyId);
    expect(chain.in).toHaveBeenCalledWith('status', ['confirmed', 'completed']);
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[2]?.count).toBe(1);
  });

  it('throws error when database query fails in useAmenityUsageKpi', async () => {
    const chain = createFilterChain({ data: null, error: new Error('Query failed') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAmenityUsageKpi(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('usePendingJoinRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => usePendingJoinRequests(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads pending join requests for a society', async () => {
    const pending = [{ id: 'profile-1', status: 'pending', full_name: 'Asha' }];
    const chain = createFilterChain({ data: pending, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => usePendingJoinRequests(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(chain.eq).toHaveBeenCalledWith('society_id', societyId);
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending');
    expect(result.current.data).toEqual(pending);
  });

  it('throws error when database query fails in usePendingJoinRequests', async () => {
    const chain = createFilterChain({ data: null, error: new Error('Query failed') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => usePendingJoinRequests(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useAdminActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useAdminActivity(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('merges recent visitors, complaints, bookings, and notices', async () => {
    const visitorsChain = createFilterChain({
      data: [{ id: 'v-1', visitor_name: 'Ravi', status: 'approved', requested_at: '2026-07-16T12:00:00.000Z' }],
      error: null,
    });
    const complaintsChain = createFilterChain({
      data: [{ id: 'c-1', title: 'Noise', status: 'new', created_at: '2026-07-16T11:00:00.000Z' }],
      error: null,
    });
    const bookingsChain = createFilterChain({
      data: [
        {
          id: 'b-1',
          amenity_id: 'amenity-1',
          start_at: '2026-07-16T10:00:00.000Z',
          status: 'confirmed',
          amenities: { name: 'Clubhouse', society_id: societyId },
        },
      ],
      error: null,
    });
    const noticesChain = createFilterChain({
      data: [{ id: 'n-1', title: 'Water shutdown', category: 'maintenance', published_at: '2026-07-16T09:00:00.000Z' }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'visitors') return { select: jest.fn(() => visitorsChain) };
      if (table === 'complaints') return { select: jest.fn(() => complaintsChain) };
      if (table === 'amenity_bookings') return { select: jest.fn(() => bookingsChain) };
      return { select: jest.fn(() => noticesChain) };
    });

    const { result } = renderHook(() => useAdminActivity(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(mockFrom).toHaveBeenCalledWith('complaints');
    expect(mockFrom).toHaveBeenCalledWith('amenity_bookings');
    expect(mockFrom).toHaveBeenCalledWith('notices');
    expect(result.current.data?.[0]?.id).toBe('v-1');
    expect(result.current.data?.[0]?.type).toBe('visitor');
    expect(result.current.data).toHaveLength(4);
  });

  it('throws error when database query fails in useAdminActivity', async () => {
    const chainError = createFilterChain({ data: null, error: new Error('Query failed') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chainError) });

    const { result } = renderHook(() => useAdminActivity(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
