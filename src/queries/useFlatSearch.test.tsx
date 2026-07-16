import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import { useFlatSearch } from './useFlatSearch';
import { createQueryWrapper } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}));

function createFlatSearchChain<T>(result: { data: T; error: null }) {
  const chain: {
    eq: jest.Mock;
    ilike: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    select: jest.Mock;
  } = {
    eq: jest.fn(),
    ilike: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
  };

  chain.eq.mockReturnValue(chain);
  chain.ilike.mockReturnValue(chain);
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

describe('useFlatSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useFlatSearch(null, '101'), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('searches flats and maps primary resident and tower name', async () => {
    const flats = [
      {
        id: 'flat-1',
        number: '101',
        towers: { name: 'Tower A' },
        flat_residents: [{ is_head: true, profiles: { full_name: 'Ravi' } }],
      },
    ];
    const chain = createFlatSearchChain({ data: flats, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFlatSearch('soc-1', '101'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('flats');
    expect(chain.eq).toHaveBeenCalledWith('towers.society_id', 'soc-1');
    expect(chain.ilike).toHaveBeenCalledWith('number', '%101%');
    expect(chain.order).toHaveBeenCalledWith('number');
    expect(chain.limit).toHaveBeenCalledWith(20);
    expect(result.current.data).toEqual([
      {
        id: 'flat-1',
        number: '101',
        primary_resident: 'Ravi',
        tower_name: 'Tower A',
      },
    ]);
  });

  it('handles fallbacks for missing primary resident, tower name, and data', async () => {
    const flats = [
      {
        id: 'flat-2',
        number: '102',
        towers: null,
        flat_residents: [{ is_head: false, profiles: { full_name: 'Amit' } }],
      },
      {
        id: 'flat-3',
        number: '103',
        towers: null,
        flat_residents: [],
      },
      {
        id: 'flat-4',
        number: '104',
        towers: null,
        flat_residents: [{ is_head: true, profiles: null }],
      },
    ];

    const chain = createFlatSearchChain({ data: flats, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFlatSearch('soc-1', '10'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        id: 'flat-2',
        number: '102',
        primary_resident: 'Amit',
        tower_name: 'Tower',
      },
      {
        id: 'flat-3',
        number: '103',
        primary_resident: null,
        tower_name: 'Tower',
      },
      {
        id: 'flat-4',
        number: '104',
        primary_resident: null,
        tower_name: 'Tower',
      },
    ]);
  });

  it('handles null data response and empty queryFn errors', async () => {
    const chainNull = createFlatSearchChain({ data: null, error: null } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chainNull) });

    const { result } = renderHook(() => useFlatSearch('soc-1', '10'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws error when database query fails', async () => {
    const chainError = createFlatSearchChain({ data: null, error: new Error('Query error') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chainError) });

    const { result } = renderHook(() => useFlatSearch('soc-1', '10'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Query error'));
  });
});
