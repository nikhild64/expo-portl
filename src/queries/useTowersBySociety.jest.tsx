import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useTowersBySociety } from './useTowersBySociety';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

const towers = [
  { id: 'tower-1', society_id: 'soc-1', name: 'A Block', sort_order: 1 },
  { id: 'tower-2', society_id: 'soc-1', name: 'B Block', sort_order: 2 },
];

describe('useTowersBySociety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useTowersBySociety(undefined), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads towers for a society ordered by sort_order', async () => {
    const chain = createSelectChain({ data: towers, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useTowersBySociety('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('towers');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });
    expect(result.current.data).toEqual(towers);
  });

  it('returns an empty array when the query has no rows', async () => {
    const chain = createSelectChain({ data: null, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useTowersBySociety('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('throws error when database query fails', async () => {
    const chain = createSelectChain({ data: null, error: new Error('Query error') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useTowersBySociety('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Query error'));
  });
});
