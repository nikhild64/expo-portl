import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import { useCreateGuard } from './useCreateGuard';
import { createMutationWrapper } from './__testUtils/queryTestUtils';

const mockInvoke = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));

describe('useCreateGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a guard via edge function and invalidates admin-guards', async () => {
    mockInvoke.mockResolvedValue({
      data: { profileId: 'guard-1', email: 'guard@example.com', fullName: 'Ravi Guard' },
      error: null,
    });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateGuard(), { wrapper });

    await act(async () => {
      const created = await result.current.mutateAsync({
        email: 'guard@example.com',
        fullName: 'Ravi Guard',
        password: 'password123',
        phone: '9999999999',
      });
      expect(created.profileId).toBe('guard-1');
    });

    expect(mockInvoke).toHaveBeenCalledWith('create-guard', {
      body: {
        email: 'guard@example.com',
        fullName: 'Ravi Guard',
        password: 'password123',
        phone: '9999999999',
      },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-guards'] });
  });

  it('maps edge function error codes to friendly messages', async () => {
    mockInvoke.mockResolvedValue({ data: { error: 'email_in_use' }, error: null });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useCreateGuard(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          email: 'guard@example.com',
          fullName: 'Ravi Guard',
          password: 'password123',
        }),
      ).rejects.toThrow('That email is already registered.');
    });
  });
});
