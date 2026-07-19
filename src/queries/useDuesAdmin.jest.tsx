import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import './__testUtils/queryTestUtils';
import {
  useDefaulters,
  useDuesCycleStatus,
  useGenerateDuesCycle,
  useLastDuesCycleTemplate,
  useSendAllPaymentReminders,
  useSendPaymentReminder,
} from './useDuesAdmin';
import {
  createMutationWrapper,
  createQueryWrapper,
  createSelectChain,
} from './__testUtils/queryTestUtils';

const mockFrom: any = jest.fn();
const mockRpc: any = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: unknown) => mockFrom(table),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

function createHeadCountChain(count: number) {
  const chain: { eq: jest.Mock; select: jest.Mock } = {
    eq: jest.fn(),
    select: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  const result = { count, error: null };
  const promise = Promise.resolve(result);
  Object.assign(chain, {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  });
  return chain;
}

function createFilterChain<T>(result: { data: T; error: null }) {
  const chain: {
    eq: jest.Mock;
    in: jest.Mock;
    lt: jest.Mock;
    order: jest.Mock;
    select: jest.Mock;
  } = {
    eq: jest.fn(),
    in: jest.fn(),
    lt: jest.fn(),
    order: jest.fn(),
    select: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.lt.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  const promise = Promise.resolve(result);
  Object.assign(chain, {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  });
  return chain;
}

describe('useDuesCycleStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId or period is missing', () => {
    const { result } = renderHook(() => useDuesCycleStatus('soc-1', undefined), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('loads occupied flat count and generated dues count for a period', async () => {
    mockRpc.mockResolvedValue({ data: 10, error: null });
    const duesCountChain = createHeadCountChain(8);
    mockFrom.mockReturnValue({ select: jest.fn(() => duesCountChain) });

    const { result } = renderHook(() => useDuesCycleStatus('soc-1', '2026-07'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRpc).toHaveBeenCalledWith('count_society_occupied_flats', { p_society: 'soc-1' });
    expect(mockFrom).toHaveBeenCalledWith('dues');
    expect(duesCountChain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(duesCountChain.eq).toHaveBeenCalledWith('period', '2026-07');
    expect(result.current.data).toEqual({ flats: 10, generated: 8 });
  });
});

describe('useLastDuesCycleTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no prior dues cycle exists', async () => {
    const chain = createSelectChain({ data: null, error: null });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useLastDuesCycleTemplate('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it('parses line items from the latest dues cycle', async () => {
    const chain = createSelectChain({
      data: {
        line_items: [{ label: 'Maintenance', amount: 1000 }],
        total: 1000,
      },
      error: null,
    });
    mockFrom.mockReturnValue({ select: jest.fn(() => chain) });

    const { result } = renderHook(() => useLastDuesCycleTemplate('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(chain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(chain.order).toHaveBeenCalledWith('period', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(1);
    expect(result.current.data).toEqual({
      lineItems: [{ label: 'Maintenance', amount: 1000 }],
      total: 1000,
    });
  });
});

describe('useGenerateDuesCycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates a dues cycle and invalidates dues-admin caches', async () => {
    mockRpc.mockResolvedValue({ data: 12, error: null });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useGenerateDuesCycle(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        dueDate: '2026-07-31',
        lineItems: [{ label: 'Maintenance', amount: 1000 }],
        period: '2026-07',
        societyId: 'soc-1',
        total: 1000,
      });
    });

    expect(mockRpc).toHaveBeenCalledWith('generate_dues_cycle', {
      p_due_date: '2026-07-31',
      p_line_items: [{ label: 'Maintenance', amount: 1000 }],
      p_period: '2026-07',
      p_society: 'soc-1',
      p_total: 1000,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dues-admin'] });
  });
});

describe('useDefaulters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when societyId is missing', () => {
    const { result } = renderHook(() => useDefaulters(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads overdue dues with matching flat residents', async () => {
    const dues = [
      {
        id: 'due-1',
        flat_id: 'flat-1',
        society_id: 'soc-1',
        status: 'overdue',
        due_date: '2026-06-01',
        flats: { number: '101', towers: { name: 'Tower A' } },
      },
    ];
    const residents = [{ flat_id: 'flat-1', profile_id: 'resident-1', profiles: { full_name: 'Asha' } }];
    const duesChain = createFilterChain({ data: dues, error: null });
    const residentsChain = createFilterChain({ data: residents, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'dues') {
        return { select: jest.fn(() => duesChain) };
      }
      return { select: jest.fn(() => residentsChain) };
    });

    const { result } = renderHook(() => useDefaulters('soc-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(duesChain.eq).toHaveBeenCalledWith('society_id', 'soc-1');
    expect(duesChain.in).toHaveBeenCalledWith('status', ['due', 'overdue']);
    expect(residentsChain.in).toHaveBeenCalledWith('flat_id', ['flat-1']);
    expect(result.current.data?.[0]?.flat_residents).toEqual(residents);
  });
});

describe('useSendPaymentReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enqueues a payment reminder and invalidates defaulters', async () => {
    mockRpc.mockResolvedValue({ error: null });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useSendPaymentReminder(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ dueId: 'due-1', profileId: 'resident-1' });
    });

    expect(mockRpc).toHaveBeenCalledWith('enqueue_notification', {
      p_body: 'Please pay your pending society dues.',
      p_category: 'payment-reminder',
      p_data: {
        dueId: 'due-1',
        template: 'paymentReminder',
        params: {},
        url: '/(resident)/(payments)',
      },
      p_profile_id: 'resident-1',
      p_title: 'Dues reminder',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dues-admin', 'defaulters'] });
  });
});

describe('useSendAllPaymentReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enqueues reminders for all targets and returns the count', async () => {
    mockRpc.mockResolvedValue({ error: null });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useSendAllPaymentReminders(), { wrapper });

    await act(async () => {
      const count = await result.current.mutateAsync([
        { dueId: 'due-1', profileId: 'resident-1' },
        { dueId: 'due-2', profileId: 'resident-2' },
      ]);
      expect(count).toBe(2);
    });

    expect(mockRpc).toHaveBeenCalledTimes(2);
  });
});
