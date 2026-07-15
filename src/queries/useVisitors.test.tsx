import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactNode } from 'react';

import { useApproveVisitor, useRejectVisitor, useVisitorsList } from './useVisitors';

const mockFrom = jest.fn();
const mockEnqueueIfOffline = jest.fn<(...args: unknown[]) => Promise<boolean>>();

function getUpdatePayload() {
  const visitorsTable = mockFrom.mock.results.at(-1)?.value as {
    update: { mock: { calls: [Record<string, unknown>[]] } };
  };
  return visitorsTable.update.mock.calls[0][0];
}

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

jest.mock('@/lib/offlineQueue', () => ({
  enqueueIfOffline: (payload: unknown) => mockEnqueueIfOffline(payload),
}));

jest.mock('@/lib/guardQueries', () => ({
  invalidateGuardActivity: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Warning: 'warning', Success: 'success' },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ session: { user: { id: 'resident-1' } } }),
  },
}));

const flatIds = ['flat-1'];

function createVisitorsSelectChain() {
  const chain: {
    eq: jest.Mock;
    in: jest.Mock;
    order: jest.Mock;
    limit: jest.Mock;
  } = {
    eq: jest.fn(),
    in: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit = jest.fn<() => Promise<{ data: unknown[]; error: null }>>();
  chain.limit.mockImplementation(async () => ({ data: [], error: null }));
  return chain;
}

function createVisitorsUpdateChain(result: {
  data?: { status: string } | null;
  error?: { message: string } | null;
}) {
  const chain: {
    eq: jest.Mock;
    select: jest.Mock;
    single: jest.Mock;
  } = {
    eq: jest.fn(),
    select: jest.fn(),
    single: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.single = jest.fn<
    () => Promise<{ data?: { status: string } | null; error?: { message: string } | null }>
  >();
  chain.single.mockImplementation(async () => result);
  return chain;
}

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mutationQueryClients: QueryClient[] = [];

function createMutationWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  mutationQueryClients.push(queryClient);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

const baseVisitor = {
  id: 'visitor-1',
  flat_id: 'flat-1',
  society_id: 'soc-1',
  status: 'pending' as const,
  type: 'guest' as const,
  visitor_name: 'Alex Guest',
  requested_at: '2026-07-15T10:00:00.000Z',
  decided_at: null,
  decided_by: null,
  entered_at: null,
  exited_at: null,
  guard_id: null,
  guard_note: null,
  pre_approval_id: null,
  pre_approved: false,
  purpose: null,
  resident_instructions: null,
  visitor_phone: null,
  visitor_photo_path: null,
};

describe('useVisitorsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueIfOffline.mockResolvedValue(false);
  });

  it('filters pending visitors with status=pending', async () => {
    const selectChain = createVisitorsSelectChain();
    mockFrom.mockReturnValue({ select: jest.fn(() => selectChain) });

    const { result } = renderHook(() => useVisitorsList(flatIds, 'pending'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(selectChain.in).toHaveBeenCalledWith('flat_id', flatIds);
    expect(selectChain.eq).toHaveBeenCalledWith('status', 'pending');
    expect(selectChain.in).not.toHaveBeenCalledWith('status', expect.any(Array));
  });

  it('filters history visitors with terminal statuses', async () => {
    const selectChain = createVisitorsSelectChain();
    mockFrom.mockReturnValue({ select: jest.fn(() => selectChain) });

    const { result } = renderHook(() => useVisitorsList(flatIds, 'history'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(selectChain.in).toHaveBeenCalledWith('status', [
      'approved',
      'entered',
      'exited',
      'rejected',
      'expired',
    ]);
    expect(selectChain.eq).not.toHaveBeenCalledWith('status', 'pending');
  });
});

describe('useApproveVisitor', () => {
  afterEach(() => {
    mutationQueryClients.splice(0).forEach((client) => client.clear());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueIfOffline.mockResolvedValue(false);
  });

  it('updates decided_at, decided_by, and status on approve', async () => {
    const updateChain = createVisitorsUpdateChain({ data: { status: 'approved' }, error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const { queryClient, wrapper } = createMutationWrapper();
    queryClient.setQueryData(['visitors', 'pending', flatIds], [baseVisitor]);

    const { result } = renderHook(() => useApproveVisitor(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'visitor-1', instructions: 'Ring twice' });
    });

    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(updateChain.eq).toHaveBeenCalledWith('id', 'visitor-1');
    const updatePayload = getUpdatePayload();
    expect(updatePayload).toMatchObject({
      decided_by: 'resident-1',
      resident_instructions: 'Ring twice',
      status: 'approved',
    });
    expect(updatePayload.decided_at).toEqual(expect.any(String));
  });

  it('rolls back optimistic cache updates when approve fails', async () => {
    const updateChain = createVisitorsUpdateChain({ data: null, error: { message: 'RLS denied' } });
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const { queryClient, wrapper } = createMutationWrapper();
    const pendingKey = ['visitors', 'pending', flatIds];
    queryClient.setQueryData(pendingKey, [baseVisitor]);

    const { result } = renderHook(() => useApproveVisitor(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ id: 'visitor-1' })).rejects.toBeDefined();
    });

    expect(queryClient.getQueryData(pendingKey)).toEqual([baseVisitor]);
  });
});

describe('useRejectVisitor', () => {
  afterEach(() => {
    mutationQueryClients.splice(0).forEach((client) => client.clear());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueIfOffline.mockResolvedValue(false);
  });

  it('updates status to rejected with decided metadata', async () => {
    const updateChain = createVisitorsUpdateChain({ data: { status: 'rejected' }, error: null });
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const { wrapper } = createMutationWrapper();
    const { result } = renderHook(() => useRejectVisitor(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'visitor-1' });
    });

    const updatePayload = getUpdatePayload();
    expect(updatePayload).toMatchObject({
      decided_by: 'resident-1',
      resident_instructions: null,
      status: 'rejected',
    });
    expect(updatePayload.decided_at).toEqual(expect.any(String));
  });

  it('rolls back optimistic cache updates when reject fails', async () => {
    const updateChain = createVisitorsUpdateChain({ data: null, error: { message: 'network' } });
    mockFrom.mockReturnValue({ update: jest.fn(() => updateChain) });

    const { queryClient, wrapper } = createMutationWrapper();
    const pendingKey = ['visitors', 'pending', flatIds];
    queryClient.setQueryData(pendingKey, [baseVisitor]);

    const { result } = renderHook(() => useRejectVisitor(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ id: 'visitor-1' })).rejects.toBeDefined();
    });

    expect(queryClient.getQueryData(pendingKey)).toEqual([baseVisitor]);
  });
});
