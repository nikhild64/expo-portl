import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import { useSocietySearch } from './useSocietySearch';
import { createQueryWrapper } from './__testUtils/queryTestUtils';

function createSearchChain<T>(result: { data: T; error: null }) {
  const chain: { or: jest.Mock; order: jest.Mock; limit: jest.Mock; select: jest.Mock } = {
    or: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
  };
  chain.or.mockReturnValue(chain);
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

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}));

const societies = [{ id: 'soc-1', name: 'Green Heights', city: 'Mumbai' }];

describe('useSocietySearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when query is shorter than minLength', () => {
    const { result } = renderHook(() => useSocietySearch('g'), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('searches societies by name or city', async () => {
    const chain = createSearchChain({ data: societies, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useSocietySearch('green'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('societies');
    expect(chain.or).toHaveBeenCalledWith('name.ilike.%green%,city.ilike.%green%');
    expect(chain.order).toHaveBeenCalledWith('name');
    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(result.current.data).toEqual(societies);
  });

  it('throws error when database query fails', async () => {
    const chain = createSearchChain({ data: null, error: new Error('Query error') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useSocietySearch('green'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Query error'));
  });

  it('returns empty array when data is null', async () => {
    const chain = createSearchChain({ data: null, error: null } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useSocietySearch('green'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
