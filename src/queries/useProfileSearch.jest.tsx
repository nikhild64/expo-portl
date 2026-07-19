import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import { useProfileSearch } from './useProfileSearch';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

jest.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}));

function createSearchChain<T>(result: { data: T; error: null }) {
  const chain: {
    eq: jest.Mock;
    in: jest.Mock;
    or: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
    select: jest.Mock;
  } = {
    eq: jest.fn(),
    in: jest.fn(),
    or: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
  };

  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
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

describe('useProfileSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useProfileSearch(null, 'ravi'), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('searches active profiles and service providers', async () => {
    const profilesChain = createSearchChain({
      data: [{ id: 'p-1', full_name: 'Ravi', phone: '9999999999', role: 'resident' }],
      error: null,
    });
    const servicesChain = createSearchChain({
      data: [{ id: 's-1', name: 'Quick Plumber', phone: '8888888888', category: 'plumber', verified: true }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => profilesChain) };
      }
      return { select: jest.fn(() => servicesChain) };
    });

    const { result } = renderHook(() => useProfileSearch('soc-1', 'ravi', ['resident']), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockFrom).toHaveBeenCalledWith('service_providers');
    expect(profilesChain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(profilesChain.in).toHaveBeenCalledWith('role', ['resident']);
    expect(servicesChain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(result.current.data).toEqual([
      { id: 'p-1', full_name: 'Ravi', phone: '9999999999', role: 'resident', kind: 'profile' },
      {
        id: 's-1',
        full_name: 'Quick Plumber',
        phone: '8888888888',
        category: 'plumber',
        verified: true,
        role: 'service_provider',
        kind: 'service_provider',
      },
    ]);
  });
});
