jest.mock('@/lib/razorpay', () => ({
  checkoutAndInvalidate: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('@/lib/alert', () => ({
  alertError: jest.fn(),
}));

import type { Tables } from '@/types/database';

import { checkoutAndInvalidate } from '@/lib/razorpay';

import { formatDueDaysLabel, invalidatePaymentQueries, payAmenityCheckout, payDuesCheckout } from './duesPayment';

const t = (key: string, opts?: { count?: number }) =>
  opts?.count !== undefined ? `${key}:${opts.count}` : key;

function dueWithDate(dueDate: string): Tables<'dues'> {
  return {
    created_at: '2026-01-01T00:00:00.000Z',
    due_date: dueDate,
    flat_id: 'flat-1',
    id: 'due-1',
    line_items: [],
    paid_at: null,
    payment_id: null,
    period: 'Jan 2026',
    society_id: 'society-1',
    status: 'pending',
    total: 1500,
  };
}

describe('formatDueDaysLabel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-10T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns due-in-days label for upcoming dues', () => {
    expect(formatDueDaysLabel(dueWithDate('2026-01-15'), t)).toBe('resident.payments.dueInDays:5');
  });

  it('returns overdue label for past due dates', () => {
    expect(formatDueDaysLabel(dueWithDate('2026-01-05'), t)).toBe('resident.payments.daysOverdue:5');
  });

  it('treats same-day dues as due today', () => {
    expect(formatDueDaysLabel(dueWithDate('2026-01-10'), t)).toBe('resident.payments.dueInDays:0');
  });
});

describe('payment checkout helpers', () => {
  const profile = { full_name: 'Resident', phone: '9999999999' };
  const queryClient = { invalidateQueries: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (checkoutAndInvalidate as jest.Mock).mockResolvedValue(undefined);
  });

  it('invalidates dues payment query caches', async () => {
    await invalidatePaymentQueries(queryClient as never, 'dues');

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dues'] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['payments', 'pending'] });
  });

  it('runs dues checkout with all due reference ids', async () => {
    const onFinally = jest.fn();
    const dues = [dueWithDate('2026-01-15'), { ...dueWithDate('2026-01-20'), id: 'due-2' }];

    await payDuesCheckout({
      amount: 3000,
      dues,
      email: 'a@test.com',
      onFinally,
      profile,
      queryClient: queryClient as never,
      t,
    });

    expect(checkoutAndInvalidate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 3000,
        purpose: 'dues',
        referenceId: 'due-1',
        referenceIds: ['due-1', 'due-2'],
      }),
    );
    expect(onFinally).toHaveBeenCalled();
  });

  it('rethrows amenity checkout failures after surfacing an alert', async () => {
    const error = new Error('slot taken');
    (checkoutAndInvalidate as jest.Mock).mockRejectedValue(error);

    await expect(
      payAmenityCheckout({
        amount: 500,
        bookingId: 'booking-1',
        profile,
        queryClient: queryClient as never,
        t,
      }),
    ).rejects.toThrow('slot taken');
  });
});
