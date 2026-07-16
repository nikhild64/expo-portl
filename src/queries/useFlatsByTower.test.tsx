import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useFlatsByTower } from './useFlatsByTower';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

const flats = [
  { id: 'flat-1', tower_id: 'tower-1', number: '101' },
  { id: 'flat-2', tower_id: 'tower-1', number: '102' },
];

describe('useFlatsByTower', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when towerId is missing', () => {
    const { result } = renderHook(() => useFlatsByTower(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads flats for a tower ordered by number', async () => {
    const chain = createSelectChain({ data: flats, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFlatsByTower('tower-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('flats');
    expect(chain.eq).toHaveBeenCalledWith('tower_id', 'tower-1');
    expect(chain.order).toHaveBeenCalledWith('number', { ascending: true });
    expect(result.current.data).toEqual(flats);
  });

  it('returns an empty array when the query has no rows', async () => {
    const chain = createSelectChain({ data: null, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFlatsByTower('tower-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('throws error when database query fails', async () => {
    const chain = createSelectChain({ data: null, error: new Error('Query error') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFlatsByTower('tower-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Query error'));
  });
});
