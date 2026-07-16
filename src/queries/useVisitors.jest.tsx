import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactNode } from 'react';

import {
  useApproveVisitor,
  useCreatePreApproval,
  usePreApproval,
  usePreApprovalsList,
  useRejectVisitor,
  useRevokePreApproval,
  useVisitor,
  useVisitorsList,
} from './useVisitors';

const mockFrom = jest.fn();
const mockVisitorDetailSelect = jest.fn<
  (id: string) => Promise<{ data: unknown; error: null }>
>();
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

jest.mock('@/queries/supabaseSelects', () => ({
  visitorDetailSelect: (id: string) => mockVisitorDetailSelect(id),
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
    gte: jest.Mock;
  } = {
    eq: jest.fn(),
    in: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    gte: jest.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.gte.mockReturnValue(chain);
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

const testQueryClients: QueryClient[] = [];

function createTestQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  testQueryClients.push(queryClient);
  return queryClient;
}

function createQueryWrapper() {
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function createMutationWrapper() {
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

afterEach(async () => {
  const clients = testQueryClients.splice(0);
  await Promise.all(clients.map((client) => client.cancelQueries()));
  clients.forEach((client) => client.clear());
});

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

describe('usePreApprovalsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueIfOffline.mockResolvedValue(false);
  });

  it('does not fetch when flatIds are missing', () => {
    const { result } = renderHook(() => usePreApprovalsList(undefined), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads active pre-approvals for the given flats', async () => {
    const preApprovals = [
      {
        id: 'pa-1',
        flat_id: 'flat-1',
        visitor_name: 'Alex Guest',
        start_at: '2026-07-16T09:00:00.000Z',
        end_at: '2026-07-16T18:00:00.000Z',
      },
    ];
    const selectChain = createVisitorsSelectChain();
    selectChain.order.mockImplementation(async () => ({ data: preApprovals, error: null }));
    mockFrom.mockReturnValue({ select: jest.fn(() => selectChain) });

    const { result } = renderHook(() => usePreApprovalsList(flatIds), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('pre_approvals');
    expect(selectChain.in).toHaveBeenCalledWith('flat_id', flatIds);
    expect(selectChain.gte).toHaveBeenCalledWith('end_at', expect.any(String));
    expect(selectChain.order).toHaveBeenCalledWith('start_at', { ascending: true });
    expect(result.current.data).toEqual(preApprovals);
  });
});

describe('useVisitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch without an id', () => {
    const { result } = renderHook(() => useVisitor(undefined), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockVisitorDetailSelect).not.toHaveBeenCalled();
  });

  it('loads visitor detail by id', async () => {
    const visitor = { ...baseVisitor, flats: { number: '101', towers: { name: 'A' } } };
    mockVisitorDetailSelect.mockResolvedValue({ data: visitor, error: null });

    const { result } = renderHook(() => useVisitor('visitor-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockVisitorDetailSelect).toHaveBeenCalledWith('visitor-1');
    expect(result.current.data).toEqual(visitor);
  });
});

describe('usePreApproval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch without an id', () => {
    const { result } = renderHook(() => usePreApproval(undefined), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads pre-approval detail by id', async () => {
    const preApproval = {
      id: 'pa-1',
      flat_id: 'flat-1',
      visitor_name: 'Alex Guest',
      start_at: '2026-07-16T09:00:00.000Z',
      end_at: '2026-07-16T18:00:00.000Z',
    };
    const single = jest.fn<
      () => Promise<{ data: typeof preApproval; error: null }>
    >().mockResolvedValue({ data: preApproval, error: null });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ select });

    const { result } = renderHook(() => usePreApproval('pa-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('pre_approvals');
    expect(eq).toHaveBeenCalledWith('id', 'pa-1');
    expect(result.current.data).toEqual(preApproval);
  });
});

describe('useRevokePreApproval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes pre-approval from caches on success', async () => {
    const preApproval = {
      id: 'pa-1',
      flat_id: 'flat-1',
      visitor_name: 'Alex Guest',
      start_at: '2026-07-16T09:00:00.000Z',
      end_at: '2026-07-16T18:00:00.000Z',
    };
    const eq = jest.fn<() => Promise<{ error: null }>>().mockResolvedValue({ error: null });
    const deleteFn = jest.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ delete: deleteFn });

    const { queryClient, wrapper } = createMutationWrapper();
    const listKey = ['pre-approvals', flatIds];
    queryClient.setQueryData(listKey, [preApproval]);
    queryClient.setQueryData(['pre-approvals', 'detail', 'pa-1'], preApproval);

    const { result } = renderHook(() => useRevokePreApproval(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('pa-1');
    });

    expect(mockFrom).toHaveBeenCalledWith('pre_approvals');
    expect(eq).toHaveBeenCalledWith('id', 'pa-1');
    expect(queryClient.getQueryData(listKey)).toEqual([]);
  });

  it('rolls back optimistic cache updates when revoke fails', async () => {
    const preApproval = {
      id: 'pa-1',
      flat_id: 'flat-1',
      visitor_name: 'Alex Guest',
      start_at: '2026-07-16T09:00:00.000Z',
      end_at: '2026-07-16T18:00:00.000Z',
    };
    const eq = jest.fn<() => Promise<{ error: { message: string } }>>().mockResolvedValue({
      error: { message: 'RLS denied' },
    });
    const deleteFn = jest.fn(() => ({ eq }));
    mockFrom.mockReturnValue({ delete: deleteFn });

    const { queryClient, wrapper } = createMutationWrapper();
    const listKey = ['pre-approvals', flatIds];
    queryClient.setQueryData(listKey, [preApproval]);

    const { result } = renderHook(() => useRevokePreApproval(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('pa-1')).rejects.toBeDefined();
    });

    expect(queryClient.getQueryData(listKey)).toEqual([preApproval]);
  });
});

describe('useCreatePreApproval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueIfOffline.mockResolvedValue(false);
  });

  it('creates a pre-approval and refreshes list and detail caches', async () => {
    const created = {
      id: 'pa-1',
      flat_id: 'flat-1',
      visitor_name: 'Alex Guest',
      start_at: '2026-07-16T09:00:00.000Z',
      end_at: '2026-07-16T18:00:00.000Z',
    };
    const single = jest.fn<
      () => Promise<{ data: typeof created; error: null }>
    >().mockResolvedValue({ data: created, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ insert });

    const { queryClient, wrapper } = createMutationWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreatePreApproval(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        flat_id: 'flat-1',
        visitor_name: 'Alex Guest',
        start_at: created.start_at,
        end_at: created.end_at,
      } as never);
    });

    expect(mockFrom).toHaveBeenCalledWith('pre_approvals');
    expect(insert).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pre-approvals'] });
    expect(queryClient.getQueryData(['pre-approvals', 'detail', 'pa-1'])).toEqual(created);
  });
});
