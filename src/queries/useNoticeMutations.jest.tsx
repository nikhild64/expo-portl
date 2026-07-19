import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useCreateNotice, useDeleteNotice, useUpdateNotice } from './useNoticeMutations';
import { createMutationWrapper } from './__testUtils/queryTestUtils';

const mockFrom: any = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

describe('useNoticeMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a notice and invalidates the list', async () => {
    const single = jest.fn<(...args: any[]) => any>().mockResolvedValue({ data: { id: 'notice-1' }, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateNotice(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ title: 'Water outage', society_id: 'soc-1' } as never);
    });

    expect(insert).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notices'] });
  });

  it('updates a notice and invalidates list and detail caches', async () => {
    const single = jest.fn<(...args: any[]) => any>().mockResolvedValue({ data: { id: 'notice-1' }, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ update });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateNotice(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'notice-1', patch: { title: 'Updated' } });
    });

    expect(eq).toHaveBeenCalledWith('id', 'notice-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notices'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notices', 'detail', 'notice-1'] });
  });

  it('deletes a notice and invalidates the list', async () => {
    const eq = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq })) });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteNotice(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('notice-1');
    });

    expect(eq).toHaveBeenCalledWith('id', 'notice-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notices'] });
  });
});
