import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useFrequentVisitors, useSaveFrequentVisitor } from './useFrequentVisitors';
import { createMutationWrapper, createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom: any = jest.fn();
const mockUseAuthStore: any = jest.fn();
const mockAlertSuccess = jest.fn<any>();
const mockAlertError = jest.fn<any>();
const mockT = jest.fn<(key: string) => string>();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: any) => mockUseAuthStore(selector),
}));

jest.mock('@/lib/alert', () => ({
  alertSuccess: (...args: unknown[]) => mockAlertSuccess(...args),
  alertError: (...args: unknown[]) => mockAlertError(...args),
}));

jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => mockT(key) },
}));

const frequentVisitor = {
  id: 'fv-1',
  profile_id: 'user-1',
  visitor_name: 'Alex Guest',
  visitor_phone: '+911234567890',
  visitor_type: 'guest',
};

describe('useFrequentVisitors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ session: { user: { id: 'user-1' } } }),
    );
    mockT.mockImplementation((key) => key);
  });

  it('does not fetch when the user is not signed in', () => {
    mockUseAuthStore.mockImplementation((selector: any) => selector({ session: null }));

    const { result } = renderHook(() => useFrequentVisitors(), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads frequent visitors for the signed-in user', async () => {
    const chain = createSelectChain({ data: [frequentVisitor], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useFrequentVisitors(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('frequent_visitors');
    expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(chain.order).toHaveBeenCalledWith('visitor_name');
    expect(result.current.data).toEqual([frequentVisitor]);
  });

  it('saves a frequent visitor and shows a success alert', async () => {
    const upsert = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useSaveFrequentVisitor(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        visitor_name: '  Alex Guest  ',
        visitor_phone: '  +911234567890  ',
        visitor_type: 'guest',
      });
    });

    expect(upsert).toHaveBeenCalledWith(
      {
        profile_id: 'user-1',
        visitor_name: 'Alex Guest',
        visitor_phone: '+911234567890',
        visitor_type: 'guest',
      },
      { onConflict: 'profile_id,visitor_phone' },
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['frequent-visitors'] });
    expect(mockAlertSuccess).toHaveBeenCalledWith(
      'alert.titles.frequentVisitorSaved',
      'resident.preapprove.frequentVisitorSaved',
    );
  });

  it('shows an error alert when save fails', async () => {
    const upsert = jest.fn<(...args: any[]) => any>().mockResolvedValue({ error: { message: 'duplicate key' } });
    mockFrom.mockReturnValue({ upsert });

    const { result } = renderHook(() => useSaveFrequentVisitor(), {
      wrapper: createMutationWrapper().wrapper,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          visitor_name: 'Alex Guest',
          visitor_phone: '+911234567890',
          visitor_type: 'guest',
        }),
      ).rejects.toEqual({ message: 'duplicate key' });
    });

    expect(mockAlertError).toHaveBeenCalledWith(
      'alert.titles.couldNotSavePreference',
      { message: 'duplicate key' },
    );
  });

  it('throws when saving without authentication', async () => {
    mockUseAuthStore.mockImplementation((selector: any) => selector({ session: null }));

    const { result } = renderHook(() => useSaveFrequentVisitor(), {
      wrapper: createMutationWrapper().wrapper,
    });

    await expect(
      result.current.mutateAsync({
        visitor_name: 'Alex Guest',
        visitor_phone: '+911234567890',
        visitor_type: 'guest',
      }),
    ).rejects.toThrow('not_authenticated');
  });
});
