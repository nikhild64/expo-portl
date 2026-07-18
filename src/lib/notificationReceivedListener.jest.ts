const mockRemove = jest.fn();
const mockAddReceivedListener = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock('expo-notifications', () => ({
  addNotificationReceivedListener: (handler: (notification: unknown) => void) => {
    mockAddReceivedListener(handler);
    return { remove: mockRemove };
  },
}));

jest.mock('@/lib/queryClient', () => ({
  queryClient: { invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args) },
}));

import { subscribeToNotificationReceived } from './notificationReceivedListener';

describe('subscribeToNotificationReceived', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invalidates queries for the notification channel id', () => {
    const unsubscribe = subscribeToNotificationReceived();
    const handler = mockAddReceivedListener.mock.calls[0][0];

    handler({
      request: { content: { data: { channelId: 'complaints' } } },
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['complaints'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['complaint-counts'] });

    unsubscribe();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('ignores notifications without a channel id', () => {
    subscribeToNotificationReceived();
    const handler = mockAddReceivedListener.mock.calls.slice(-1)[0]?.[0];

    handler?.({ request: { content: { data: {} } } });
    handler?.({ request: { content: { data: { channelId: '' } } } });

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it('removes any previous subscription before subscribing again', () => {
    subscribeToNotificationReceived();
    subscribeToNotificationReceived();
    expect(mockRemove).toHaveBeenCalled();
  });
});
