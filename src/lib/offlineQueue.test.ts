import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { registerAuthUserIdGetter } from './authSession';
import {
  clearOfflineQueue,
  drainOfflineQueue,
  enqueueIfOffline,
  getPendingCount,
  subscribePendingCount,
} from './offlineQueue';

const mockFrom = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockInvalidateGuardActivity = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

jest.mock('@/lib/queryClient', () => ({
  queryClient: { invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args) },
}));

jest.mock('@/lib/guardQueries', () => ({
  invalidateGuardActivity: (...args: unknown[]) => mockInvalidateGuardActivity(...args),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;
const mockNetInfoFetch = NetInfo.fetch as jest.Mock;
const storage = new Map<string, string>();

function mockOffline() {
  mockNetInfoFetch.mockResolvedValue({ isConnected: true, isInternetReachable: false });
}

function mockOnline() {
  mockNetInfoFetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
}

describe('offlineQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.clear();
    registerAuthUserIdGetter(() => 'user-1');
    mockGetItem.mockImplementation(async (key: string) => storage.get(key) ?? null);
    mockSetItem.mockImplementation(async (key: string, value: string) => {
      storage.set(key, value);
    });
    mockRemoveItem.mockImplementation(async (key: string) => {
      storage.delete(key);
    });
    mockOnline();
  });

  it('does not enqueue when the device is online', async () => {
    expect(
      await enqueueIfOffline({ type: 'approve_visitor', payload: { visitorId: 'v-1' } }),
    ).toBe(false);
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('enqueues approve actions when offline and dedupes by visitor', async () => {
    mockOffline();
    mockGetItem.mockResolvedValue(
      JSON.stringify([
        {
          id: 'old',
          type: 'approve_visitor',
          payload: { visitorId: 'v-1', instructions: 'Old' },
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );

    expect(
      await enqueueIfOffline({ type: 'approve_visitor', payload: { visitorId: 'v-1', instructions: 'New' } }),
    ).toBe(true);

    const saved = JSON.parse(mockSetItem.mock.calls[0][1] as string) as Array<{ payload: { instructions?: string } }>;
    expect(saved).toHaveLength(1);
    expect(saved[0]?.payload.instructions).toBe('New');
  });

  it('tracks pending count and notifies subscribers', async () => {
    mockOffline();
    const listener = jest.fn();
    subscribePendingCount(listener);

    await enqueueIfOffline({ type: 'reject_visitor', payload: { visitorId: 'v-2' } });

    expect(listener).toHaveBeenCalledWith(1);
    await expect(getPendingCount()).resolves.toBe(1);
  });

  it('clears the queue for the active user', async () => {
    const listener = jest.fn();
    subscribePendingCount(listener);

    await clearOfflineQueue('user-1');

    expect(mockRemoveItem).toHaveBeenCalledWith('portl:offline-mutation-queue:user-1');
    expect(listener).toHaveBeenCalledWith(0);
  });

  it('replays queued mutations when back online', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify([
        {
          id: 'q-1',
          type: 'approve_visitor',
          payload: { visitorId: 'v-1' },
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );

    const single = jest.fn().mockResolvedValue({ data: { status: 'approved' }, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    await drainOfflineQueue();

    expect(mockFrom).toHaveBeenCalledWith('visitors');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['visitors'] });
    expect(mockInvalidateGuardActivity).toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith('portl:offline-mutation-queue:user-1', '[]');
  });

  it('skips draining while offline or without a signed-in user', async () => {
    mockOffline();
    await drainOfflineQueue();
    expect(mockFrom).not.toHaveBeenCalled();

    mockOnline();
    registerAuthUserIdGetter(() => undefined);
    await drainOfflineQueue();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('replays queued reject_visitor and mark_exit mutations', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify([
        {
          id: 'q-2',
          type: 'reject_visitor',
          payload: { visitorId: 'v-2' },
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'q-3',
          type: 'mark_exit',
          payload: { visitorId: 'v-3' },
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );

    const mockUpdate = jest.fn();
    mockFrom.mockReturnValue({ update: mockUpdate });

    const singleReject = jest.fn().mockResolvedValue({ data: { status: 'rejected' }, error: null });
    const selectReject = jest.fn(() => ({ single: singleReject }));
    const eqReject = jest.fn(() => ({ select: selectReject }));
    
    const singleExit = jest.fn().mockResolvedValue({ data: { status: 'exited' }, error: null });
    const selectExit = jest.fn(() => ({ single: singleExit }));
    const eqExit = jest.fn(() => ({ select: selectExit }));

    mockUpdate
      .mockReturnValueOnce({ eq: eqReject })
      .mockReturnValueOnce({ eq: eqExit });

    await drainOfflineQueue();

    expect(mockFrom).toHaveBeenCalledTimes(2);
    expect(mockSetItem).toHaveBeenCalledWith('portl:offline-mutation-queue:user-1', '[]');
  });

  it('handles failed mutation replays and logs warnings', async () => {
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();

    mockGetItem.mockResolvedValue(
      JSON.stringify([
        {
          id: 'q-4',
          type: 'reject_visitor',
          payload: { visitorId: 'v-4' },
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );

    const single = jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    mockFrom.mockReturnValue({ update: jest.fn(() => ({ eq })) });

    await drainOfflineQueue();

    expect(console.warn).toHaveBeenCalled();
    console.warn = originalConsoleWarn;
  });

  it('keeps mutation in queue if replay throws an exception', async () => {
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();

    mockGetItem.mockResolvedValue(
      JSON.stringify([
        {
          id: 'q-5',
          type: 'approve_visitor',
          payload: { visitorId: 'v-5' },
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );

    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected exception');
    });

    await drainOfflineQueue();

    expect(console.warn).toHaveBeenCalled();
    const saved = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('q-5');

    console.warn = originalConsoleWarn;
  });

  it('returns empty queue on JSON parsing failure or empty key', async () => {
    mockOffline();
    mockGetItem.mockResolvedValue('malformed-json');
    expect(await getPendingCount()).toBe(0);

    registerAuthUserIdGetter(() => undefined);
    expect(await getPendingCount()).toBe(0);
  });
});
