import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import { useSociety, useUpdateSociety } from './useSocietyAdmin';
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

const society = { id: 'soc-1', name: 'Green Heights', city: 'Mumbai' };

describe('useSociety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when id is missing', () => {
    const { result } = renderHook(() => useSociety(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads a society by id', async () => {
    const chain = createSelectChain({ data: society, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useSociety('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('societies');
    expect(chain.eq).toHaveBeenCalledWith('id', 'soc-1');
    expect(result.current.data).toEqual(society);
  });
});

describe('useUpdateSociety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates a society and invalidates its cache', async () => {
    const updated = { ...society, name: 'Green Heights Residency' };
    const updateChain = createUpdateChain({ data: updated, error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateSociety(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'soc-1', patch: { name: 'Green Heights Residency' } });
    });

    expect(mockFrom).toHaveBeenCalledWith('societies');
    expect(updateChain.eq).toHaveBeenCalledWith('id', 'soc-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['society', 'soc-1'] });
  });
});
