import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import { useAdminGuards, useGuardDetail, useUpdateGuard } from './useAdminGuards';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
  createUpdateChain,
} from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}));

function createGuardListChain<T>(result: { data: T; error: null }) {
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

const guard = { id: 'guard-1', full_name: 'Ravi', role: 'guard', status: 'active', society_id: 'soc-1' };

describe('useAdminGuards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useAdminGuards(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads guards with status and search filters', async () => {
    const chain = createGuardListChain({ data: [guard], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAdminGuards('soc-1', { status: 'active', search: 'Ravi' }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.eq).toHaveBeenCalledWith('role', 'guard');
    expect(chain.eq).toHaveBeenCalledWith('status', 'active');
    expect(chain.ilike).toHaveBeenCalledWith('full_name', '%Ravi%');
    expect(result.current.data).toEqual([guard]);
  });
});

describe('useGuardDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads a guard profile by id', async () => {
    const chain = createSelectChain({ data: guard, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useGuardDetail('guard-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('id', 'guard-1');
    expect(chain.eq).toHaveBeenCalledWith('role', 'guard');
    expect(result.current.data).toEqual(guard);
  });
});

describe('useUpdateGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates a guard and invalidates guard caches', async () => {
    const updated = { ...guard, status: 'blocked' };
    const updateChain = createUpdateChain({ data: updated, error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateGuard(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'guard-1', patch: { status: 'blocked' } });
    });

    expect(updateChain.eq).toHaveBeenCalledWith('id', 'guard-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-guards'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-guards', 'detail', 'guard-1'] });
  });
});
