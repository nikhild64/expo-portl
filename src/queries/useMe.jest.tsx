import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useMyFlatIds, useMyPrimaryFlat } from './useMe';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();
const mockUseAuthStore = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => mockUseAuthStore(selector),
}));

describe('useMe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ session: { user: { id: 'user-1' } } }),
    );
  });

  it('loads flat ids for the signed-in user', async () => {
    const chain = createSelectChain({ data: [{ flat_id: 'flat-1' }, { flat_id: 'flat-2' }], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useMyFlatIds(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('flat_residents');
    expect(chain.eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(result.current.data).toEqual(['flat-1', 'flat-2']);
  });

  it('loads the primary flat ordered by head resident', async () => {
    const primaryFlat = { flat_id: 'flat-1', is_head: true, flats: { id: 'flat-1', number: '101' } };
    const chain = createSelectChain({ data: primaryFlat, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useMyPrimaryFlat(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.order).toHaveBeenCalledWith('is_head', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(1);
    expect(result.current.data).toEqual(primaryFlat);
  });
});
