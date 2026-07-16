jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

import {
  bookingDisplayStatus,
  isBookingPaymentFailed,
  bookingStatusLabel,
  bookingStatusTone,
  bookingStatusIcon,
} from './bookingStatus';

describe('bookingStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('treats recent failed payments as failed display status', () => {
    expect(
      isBookingPaymentFailed({
        status: 'pending',
        payments: { status: 'failed' },
        created_at: '2026-07-10T00:00:00.000Z',
      }),
    ).toBe(true);

    expect(
      isBookingPaymentFailed({
        status: 'pending',
        payments: { status: 'failed' },
        created_at: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe(false);
  });

  it('maps failed payment state to failed display status', () => {
    expect(bookingDisplayStatus({ status: 'pending', payments: { status: 'failed' } })).toBe('failed');
    expect(bookingDisplayStatus({ status: 'confirmed', payments: { status: 'paid' } })).toBe('confirmed');
  });

  it('identifies booking payment failure based on booking status', () => {
    expect(
      isBookingPaymentFailed({
        status: 'failed',
        payments: null,
        created_at: '2026-07-10T00:00:00.000Z',
      }),
    ).toBe(true);

    expect(
      isBookingPaymentFailed({
        status: 'confirmed',
        payments: { status: 'paid' },
        created_at: '2026-07-10T00:00:00.000Z',
      }),
    ).toBe(false);
  });

  it('provides correct status displays', () => {
    expect(bookingStatusLabel('failed')).toBe('resident.payments.paymentFailed');
    expect(bookingStatusLabel('pending')).toBe('resident.amenities.pendingPayment');
    expect(bookingStatusLabel('confirmed')).toBe('resident.amenities.confirmed');
    expect(bookingStatusLabel('completed')).toBe('resident.amenities.completed');
    expect(bookingStatusLabel('cancelled')).toBe('resident.amenities.cancelled');

    expect(bookingStatusTone('failed')).toBe('danger');
    expect(bookingStatusTone('pending')).toBe('warning');
    expect(bookingStatusTone('confirmed')).toBe('success');
    expect(bookingStatusTone('completed')).toBe('success');
    expect(bookingStatusTone('cancelled')).toBe('neutral');

    expect(bookingStatusIcon('failed')).toBe('error_outline');
    expect(bookingStatusIcon('pending')).toBe('schedule');
    expect(bookingStatusIcon('confirmed')).toBe('check_circle');
    expect(bookingStatusIcon('completed')).toBe('check_circle');
    expect(bookingStatusIcon('cancelled')).toBe('cancel');
  });
});
