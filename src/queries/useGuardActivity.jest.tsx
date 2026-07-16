import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useRecentActivity } from './useGuardActivity';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/lib/format', () => ({
  startOfTodayIso: () => '2026-07-16T00:00:00.000Z',
}));

function extendSelectChain<T>(
  result: { data: T; error: null } | { data: null; error: { message: string } },
) {
  const chain = createSelectChain(result) as ReturnType<typeof createSelectChain> & {
    gte: jest.Mock;
  };
  chain.gte = jest.fn().mockReturnValue(chain);
  return chain;
}

describe('useRecentActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useRecentActivity(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads recent visitor activity for today', async () => {
    const visitors = [
      {
        id: 'visitor-1',
        society_id: 'soc-1',
        visitor_name: 'Alex Guest',
        status: 'entered',
        flats: { number: '101', towers: { name: 'A Block' } },
      },
    ];
    const chain = extendSelectChain({ data: visitors, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useRecentActivity('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.gte).toHaveBeenCalledWith('requested_at', '2026-07-16T00:00:00.000Z');
    expect(chain.order).toHaveBeenCalledWith('requested_at', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(5);
    expect(result.current.data).toEqual(visitors);
  });
});
