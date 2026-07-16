import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useSocietyByCode } from './useSocietyByCode';
import { createQueryWrapper, createSelectChain } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

const society = {
  id: 'soc-1',
  code: 'ABCD',
  name: 'Green Valley',
};

describe('useSocietyByCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when the code is shorter than four characters', () => {
    const { result } = renderHook(() => useSocietyByCode('abc'), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('fetches a society by trimmed uppercase code', async () => {
    const chain = createSelectChain({ data: society, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useSocietyByCode('  abcd  '), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('societies');
    expect(chain.eq).toHaveBeenCalledWith('code', 'ABCD');
    expect(result.current.data).toEqual(society);
  });

  it('returns null when no society matches the code', async () => {
    const chain = createSelectChain({ data: null, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useSocietyByCode('WXYZ'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it('throws error when database query fails', async () => {
    const chain = createSelectChain({ data: null, error: new Error('Query error') } as any);
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useSocietyByCode('ABCD'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Query error'));
  });
});
