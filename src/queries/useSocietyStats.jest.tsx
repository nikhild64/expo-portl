import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import { useSocietyStats } from './useSocietyStats';
import { createQueryWrapper } from './__testUtils/queryTestUtils';

const mockFrom = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: unknown) => mockFrom(table) },
}));

function createHeadCountChain(count: number) {
  const chain: { eq: jest.Mock; select: jest.Mock } = {
    eq: jest.fn(),
    select: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);

  const promise = Promise.resolve({ count, error: null });
  return Object.assign(chain, {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  });
}

describe('useSocietyStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useSocietyStats(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns resident and tower counts with since year from createdAt', async () => {
    const residentsChain = createHeadCountChain(42);
    const towersChain = createHeadCountChain(3);

    mockFrom.mockImplementation((table: unknown) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => residentsChain) };
      }
      return { select: jest.fn(() => towersChain) };
    });

    const { result } = renderHook(() => useSocietyStats('soc-1', '2020-05-10T00:00:00.000Z'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockFrom).toHaveBeenCalledWith('towers');
    expect(residentsChain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(towersChain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(result.current.data).toEqual({
      residentCount: 42,
      towerCount: 3,
      sinceYear: 2020,
    });
  });

  it('falls back to current year when createdAt is missing and handles null counts', async () => {
    const residentsChain: any = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockImplementation(() => {
        const res = { count: null, error: null };
        const promise = Promise.resolve(res);
        return Object.assign(residentsChain, {
          then: promise.then.bind(promise),
          catch: promise.catch.bind(promise),
          finally: promise.finally.bind(promise),
        });
      }),
    };
    const towersChain: any = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockImplementation(() => {
        const res = { count: null, error: null };
        const promise = Promise.resolve(res);
        return Object.assign(towersChain, {
          then: promise.then.bind(promise),
          catch: promise.catch.bind(promise),
          finally: promise.finally.bind(promise),
        });
      }),
    };

    mockFrom.mockImplementation((table: unknown) => {
      if (table === 'profiles') return residentsChain;
      return towersChain;
    });

    const { result } = renderHook(() => useSocietyStats('soc-1', null), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      residentCount: 0,
      towerCount: 0,
      sinceYear: new Date().getFullYear(),
    });
  });

  it('throws error when database queries fail', async () => {
    const residentsChain: any = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockImplementation(() => {
        const res = { count: null, error: new Error('Profile fetch failed') };
        const promise = Promise.resolve(res);
        return Object.assign(residentsChain, {
          then: promise.then.bind(promise),
          catch: promise.catch.bind(promise),
          finally: promise.finally.bind(promise),
        });
      }),
    };
    const towersChain = createHeadCountChain(3);

    mockFrom.mockImplementation((table: unknown) => {
      if (table === 'profiles') return residentsChain;
      return { select: jest.fn(() => towersChain) };
    });

    const { result } = renderHook(() => useSocietyStats('soc-1', '2020-01-01'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Profile fetch failed'));
  });
});
