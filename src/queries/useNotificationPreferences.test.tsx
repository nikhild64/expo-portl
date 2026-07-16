import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useNotificationPreferences, useUpdateNotificationPreferences } from './useNotificationPreferences';
import { createMutationWrapper, createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();
const mockUseAuthStore = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => mockUseAuthStore(selector),
}));

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ session: { user: { id: 'user-1' } } }),
    );
  });

  it('merges stored preferences with defaults', async () => {
    const chain = createSelectChain({
      data: { visitors: false, notices: true, polls: true, payments: true, complaints: true },
      error: null,
    });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      visitors: false,
      notices: true,
      polls: true,
      payments: true,
      complaints: true,
    });
  });

  it('upserts preference changes for the signed-in user', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateNotificationPreferences(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ polls: false });
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ profile_id: 'user-1', polls: false, updated_at: expect.any(String) }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notification-preferences', 'user-1'] });
  });
});
