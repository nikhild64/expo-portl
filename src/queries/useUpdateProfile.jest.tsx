import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useUpdateProfile } from './useUpdateProfile';
import { createMutationWrapper } from './__testUtils/queryTestUtils';

const mockFrom: any = jest.fn();
const mockRefreshProfile = jest.fn<() => Promise<void>>();
const mockSetState = jest.fn();

const mockAuthState = {
  session: { user: { id: 'user-1' } } as { user: { id: string } } | null,
  refreshProfile: mockRefreshProfile,
};

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => mockAuthState,
    setState: (state: unknown) => mockSetState(state),
  },
}));

const updatedProfile = {
  id: 'user-1',
  full_name: 'Alex Resident',
  avatar_url: 'https://example.com/avatar.png',
  phone: '+911234567890',
};

describe('useUpdateProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.session = { user: { id: 'user-1' } };
    mockRefreshProfile.mockResolvedValue(undefined);
  });

  it('throws when the user is not signed in', async () => {
    mockAuthState.session = null;

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createMutationWrapper().wrapper,
    });

    await expect(
      result.current.mutateAsync({ fullName: 'Alex Resident' }),
    ).rejects.toThrow('Sign in required');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('updates the profile and refreshes auth state', async () => {
    const single = jest.fn<(...args: any[]) => any>().mockResolvedValue({ data: updatedProfile, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ update });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        fullName: 'Alex Resident',
        avatarUrl: 'https://example.com/avatar.png',
        phone: '+911234567890',
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar_url: 'https://example.com/avatar.png',
        full_name: 'Alex Resident',
        phone: '+911234567890',
        updated_at: expect.any(String),
      }),
    );
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['me'] });
    expect(mockRefreshProfile).toHaveBeenCalledWith({ force: true });
    expect(mockSetState).toHaveBeenCalledWith({ profile: updatedProfile });
  });
});
