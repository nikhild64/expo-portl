import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useCreatePoll, useDeletePoll, useUpdatePoll } from './usePollMutations';
import { createMutationWrapper } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

describe('usePollMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a poll and invalidates the list', async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: 'poll-1' }, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreatePoll(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        society_id: 'soc-1',
        question: 'Should we repaint the lobby?',
      } as never);
    });

    expect(mockFrom).toHaveBeenCalledWith('polls');
    expect(insert).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['polls'] });
  });

  it('updates a poll and invalidates list and detail caches', async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: 'poll-1' }, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ update });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdatePoll(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'poll-1', patch: { question: 'Updated question' } });
    });

    expect(eq).toHaveBeenCalledWith('id', 'poll-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['polls'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['polls', 'detail', 'poll-1'] });
  });

  it('deletes a poll and invalidates the list', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeletePoll(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('poll-1');
    });

    expect(mockFrom).toHaveBeenCalledWith('polls');
    expect(eq).toHaveBeenCalledWith('id', 'poll-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['polls'] });
  });
});
