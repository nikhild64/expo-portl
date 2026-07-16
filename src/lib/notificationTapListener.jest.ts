const mockRemove = jest.fn();
const mockAddResponseListener = jest.fn();
const mockGetLastNotificationResponse = jest.fn();
const mockPushRoute = jest.fn();

const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockIs = jest.fn();

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: (handler: (response: unknown) => void) => {
    mockAddResponseListener(handler);
    return { remove: mockRemove };
  },
  getLastNotificationResponse: () => mockGetLastNotificationResponse(),
}));

jest.mock('@/lib/notificationRoutes', () => ({
  pushNotificationRoute: (...args: unknown[]) => mockPushRoute(...args),
}));

jest.mock('./supabase', () => ({
  supabase: {
    from: () => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: mockEq };
      },
    }),
  },
}));

import { subscribeToNotificationTaps } from './notificationTapListener';

mockEq.mockReturnValue({ is: mockIs });
mockIs.mockResolvedValue({ error: null });

describe('subscribeToNotificationTaps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetLastNotificationResponse.mockReturnValue(null);
    mockEq.mockReturnValue({ is: mockIs });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('handles a cold-start notification with a deep link', async () => {
    mockGetLastNotificationResponse.mockReturnValue({
      notification: {
        request: {
          content: {
            data: { url: '/(resident)/(home)', notificationId: 'n-1' },
          },
        },
      },
    });

    subscribeToNotificationTaps();

    jest.runOnlyPendingTimers();
    await Promise.resolve();

    expect(mockPushRoute).toHaveBeenCalledWith('/(resident)/(home)');
    expect(mockUpdate).toHaveBeenCalledWith({ read_at: expect.any(String) });
    expect(mockEq).toHaveBeenCalledWith('id', 'n-1');
  });

  it('routes taps and marks notifications read', async () => {
    const unsubscribe = subscribeToNotificationTaps();
    const handler = mockAddResponseListener.mock.calls.at(-1)?.[0];

    handler?.({
      notification: {
        request: {
          content: {
            data: { url: '/(guard)/(log)', notificationId: 'n-2' },
          },
        },
      },
    });

    await Promise.resolve();

    expect(mockPushRoute).toHaveBeenCalledWith('/(guard)/(log)');
    expect(mockUpdate).toHaveBeenCalledWith({ read_at: expect.any(String) });
    expect(mockEq).toHaveBeenCalledWith('id', 'n-2');

    unsubscribe();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('skips notifications without a url', async () => {
    subscribeToNotificationTaps();
    const handler = mockAddResponseListener.mock.calls.at(-1)?.[0];

    handler?.({ notification: { request: { content: { data: {} } } } });

    expect(mockPushRoute).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
