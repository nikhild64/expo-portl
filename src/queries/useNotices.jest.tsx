import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useNoticeCounts, useNotices } from './useNotices';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

const societyId = 'soc-1';

function createNoticesSelectChain<T>(
  result: { data: T; error: null } | { data: null; error: { message: string } },
) {
  const chain = createSelectChain(result) as ReturnType<typeof createSelectChain> & {
    range: jest.Mock;
  };
  chain.range = jest.fn().mockImplementation(async () => result);
  return chain;
}

describe('useNotices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useNotices(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads paginated notices for a society', async () => {
    const notices = [{ id: 'notice-1', title: 'Water outage', society_id: societyId, pinned: false }];
    const chain = createNoticesSelectChain({ data: notices, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useNotices(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('notices');
    expect(chain.eq).toHaveBeenCalledWith('society_id', societyId);
    expect(chain.order).toHaveBeenCalledWith('pinned', { ascending: false });
    expect(chain.order).toHaveBeenCalledWith('published_at', { ascending: false });
    expect(chain.range).toHaveBeenCalledWith(0, 24);
    expect(result.current.data?.pages[0]?.items).toEqual(notices);
  });

  it('filters pinned notices when category is pinned', async () => {
    const chain = createNoticesSelectChain({ data: [], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useNotices(societyId, 'pinned'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('pinned', true);
  });

  it('filters by notice category when provided', async () => {
    const chain = createNoticesSelectChain({ data: [], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useNotices(societyId, 'maintenance'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('category', 'maintenance');
  });
});

describe('useNoticeCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useNoticeCounts(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('aggregates notice counts by category and pinned state', async () => {
    const rows = [
      { category: 'general', pinned: true },
      { category: 'maintenance', pinned: false },
      { category: 'event', pinned: false },
      { category: 'emergency', pinned: true },
    ];
    const chain = createSelectChain({ data: rows, error: null });
    const select = jest.fn(() => chain);
    mockFrom.mockReturnValue({ select });

    const { result } = renderHook(() => useNoticeCounts(societyId), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('notices');
    expect(select).toHaveBeenCalledWith('category, pinned');
    expect(chain.eq).toHaveBeenCalledWith('society_id', societyId);
    expect(result.current.data).toEqual({
      all: 4,
      pinned: 2,
      event: 1,
      maintenance: 1,
      general: 1,
      emergency: 1,
    });
  });
});
