import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  useExpectedToday,
  usePendingVisitors,
  useRecentNotices,
  useUpcomingBooking,
} from './useHome';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

function extendSelectChain<T>(
  result: { data: T; error: null } | { data: null; error: { message: string } },
) {
  const chain = createSelectChain(result) as ReturnType<typeof createSelectChain> & {
    gte: jest.Mock;
    lte: jest.Mock;
    or: jest.Mock;
  };
  chain.gte = jest.fn().mockReturnValue(chain);
  chain.lte = jest.fn().mockReturnValue(chain);
  chain.or = jest.fn().mockReturnValue(chain);
  return chain;
}

const flatIds = ['flat-1', 'flat-2'];

describe('useHome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePendingVisitors', () => {
    it('does not fetch when flatIds are missing', () => {
      const { result } = renderHook(() => usePendingVisitors(undefined), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('loads pending visitors for the given flats', async () => {
      const visitors = [{ id: 'visitor-1', status: 'pending', flat_id: 'flat-1' }];
      const chain = createSelectChain({ data: visitors, error: null });
      mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

      const { result } = renderHook(() => usePendingVisitors(flatIds), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFrom).toHaveBeenCalledWith('visitors');
      expect(chain.in).toHaveBeenCalledWith('flat_id', flatIds);
      expect(chain.eq).toHaveBeenCalledWith('status', 'pending');
      expect(chain.order).toHaveBeenCalledWith('requested_at', { ascending: false });
      expect(chain.limit).toHaveBeenCalledWith(20);
      expect(result.current.data).toEqual(visitors);
    });
  });

  describe('useExpectedToday', () => {
    it('does not fetch when flatIds are missing', () => {
      const { result } = renderHook(() => useExpectedToday([]), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('loads pre-approvals expected today for the given flats', async () => {
      const preApprovals = [{ id: 'pa-1', flat_id: 'flat-1', visitor_name: 'Alex' }];
      const chain = extendSelectChain({ data: preApprovals, error: null });
      mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

      const { result } = renderHook(() => useExpectedToday(flatIds), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFrom).toHaveBeenCalledWith('pre_approvals');
      expect(chain.in).toHaveBeenCalledWith('flat_id', flatIds);
      expect(chain.gte).toHaveBeenCalledWith('start_at', expect.any(String));
      expect(chain.lte).toHaveBeenCalledWith('start_at', expect.any(String));
      expect(chain.or).toHaveBeenCalledWith('qr_used_at.is.null,recurring.eq.true');
      expect(chain.order).toHaveBeenCalledWith('start_at', { ascending: true });
      expect(result.current.data).toEqual(preApprovals);
    });
  });

  describe('useRecentNotices', () => {
    it('does not fetch when societyId is missing', () => {
      const { result } = renderHook(() => useRecentNotices(null), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('loads recent notices for a society', async () => {
      const notices = [{ id: 'notice-1', title: 'Water outage', pinned: true }];
      const chain = createSelectChain({ data: notices, error: null });
      mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

      const { result } = renderHook(() => useRecentNotices('soc-1'), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFrom).toHaveBeenCalledWith('notices');
      expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
      expect(chain.order).toHaveBeenCalledWith('pinned', { ascending: false });
      expect(chain.order).toHaveBeenCalledWith('published_at', { ascending: false });
      expect(chain.limit).toHaveBeenCalledWith(3);
      expect(result.current.data).toEqual(notices);
    });

    it('respects a custom notice limit', async () => {
      const chain = createSelectChain({ data: [], error: null });
      mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

      const { result } = renderHook(() => useRecentNotices('soc-1', 5), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(chain.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('useUpcomingBooking', () => {
    it('does not fetch when profileId is missing', () => {
      const { result } = renderHook(() => useUpcomingBooking(undefined), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('loads the next upcoming amenity booking for a profile', async () => {
      const booking = {
        id: 'booking-1',
        profile_id: 'user-1',
        status: 'confirmed',
        amenities: { name: 'Clubhouse' },
      };
      const chain = extendSelectChain({ data: booking, error: null });
      mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

      const { result } = renderHook(() => useUpcomingBooking('user-1'), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFrom).toHaveBeenCalledWith('amenity_bookings');
      expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
      expect(chain.gte).toHaveBeenCalledWith('start_at', expect.any(String));
      expect(chain.in).toHaveBeenCalledWith('status', ['pending', 'confirmed']);
      expect(chain.order).toHaveBeenCalledWith('start_at', { ascending: true });
      expect(chain.limit).toHaveBeenCalledWith(1);
      expect(chain.maybeSingle).toHaveBeenCalled();
      expect(result.current.data).toEqual(booking);
    });
  });
});
