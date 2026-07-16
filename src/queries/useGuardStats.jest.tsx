import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useGuardStats, useInsideCount, usePendingApprovalsCount, useTodayVisitorsCount } from './useGuardStats';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/lib/format', () => ({
  startOfTodayIso: () => '2026-07-16T00:00:00.000Z',
  endOfTodayIso: () => '2026-07-16T23:59:59.999Z',
}));

function extendSelectChain<T>(
  result: { data: T; error: null } | { data: null; error: { message: string } },
) {
  const chain = createSelectChain(result) as ReturnType<typeof createSelectChain> & {
    or: jest.Mock;
  };
  chain.or = jest.fn().mockReturnValue(chain);
  return chain;
}

const todayStart = '2026-07-16T10:00:00.000Z';
const todayEnd = '2026-07-16T18:00:00.000Z';

describe('useGuardStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useGuardStats(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('aggregates inside, pending, and today visitor counts', async () => {
    const rows = [
      { status: 'pending', requested_at: todayStart, entered_at: null, exited_at: null },
      { status: 'approved', requested_at: todayStart, entered_at: todayStart, exited_at: null },
      { status: 'entered', requested_at: '2026-07-15T10:00:00.000Z', entered_at: todayEnd, exited_at: null },
      { status: 'exited', requested_at: todayStart, entered_at: todayStart, exited_at: todayEnd },
    ];
    const chain = extendSelectChain({ data: rows, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useGuardStats('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.or).toHaveBeenCalledWith(
      'and(requested_at.gte.2026-07-16T00:00:00.000Z,requested_at.lte.2026-07-16T23:59:59.999Z),and(entered_at.gte.2026-07-16T00:00:00.000Z,entered_at.lte.2026-07-16T23:59:59.999Z,exited_at.is.null)',
    );
    expect(result.current.data).toEqual({ inside: 2, pending: 1, today: 3 });
  });

  it('exposes deprecated count helpers from useGuardStats', async () => {
    const chain = extendSelectChain({
      data: [{ status: 'pending', requested_at: todayStart, entered_at: null, exited_at: null }],
      error: null,
    });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result: inside } = renderHook(() => useInsideCount('soc-1'), {
      wrapper: createQueryWrapper(),
    });
    const { result: pending } = renderHook(() => usePendingApprovalsCount('soc-1'), {
      wrapper: createQueryWrapper(),
    });
    const { result: today } = renderHook(() => useTodayVisitorsCount('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(inside.current.isSuccess).toBe(true));
    await waitFor(() => expect(pending.current.isSuccess).toBe(true));
    await waitFor(() => expect(today.current.isSuccess).toBe(true));

    expect(inside.current.data).toBe(0);
    expect(pending.current.data).toBe(1);
    expect(today.current.data).toBe(1);
  });

  it('throws error when database queries fail', async () => {
    const chain = extendSelectChain({ data: null, error: { message: 'Fetch error' } } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useGuardStats('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({ message: 'Fetch error' });
  });

  it('handles null data response and falls back to empty array', async () => {
    const chain = extendSelectChain({ data: null, error: null } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useGuardStats('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ inside: 0, pending: 0, today: 0 });
  });
});
