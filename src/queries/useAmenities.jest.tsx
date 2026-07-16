import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useAmenities, useAmenity } from './useAmenities';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

const amenity = {
  id: 'amenity-1',
  society_id: 'soc-1',
  name: 'Clubhouse',
  active: true,
};

describe('useAmenities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useAmenities(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads active amenities for a society', async () => {
    const chain = createSelectChain({ data: [amenity], error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAmenities('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('amenities');
    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.eq).toHaveBeenCalledWith('active', true);
    expect(chain.order).toHaveBeenCalledWith('name');
    expect(result.current.data).toEqual([amenity]);
  });

  it('loads a single amenity by id', async () => {
    const chain = createSelectChain({ data: amenity, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useAmenity('amenity-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('id', 'amenity-1');
    expect(chain.single).toHaveBeenCalled();
    expect(result.current.data).toEqual(amenity);
  });
});
