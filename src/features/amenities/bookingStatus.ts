import i18n from '@/i18n';
import type { Tables } from '@/types/database';

type BookingStatus = Tables<'amenity_bookings'>['status'];
type PaymentStatus = Tables<'payments'>['status'];

export type AmenityBookingWithPayment = Tables<'amenity_bookings'> & {
  amenities?: { name: string } | null;
  payments?: { status: PaymentStatus } | null;
};

const FAILED_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

export function isBookingPaymentFailed(booking: Pick<AmenityBookingWithPayment, 'status' | 'payments' | 'created_at'>) {
  if (booking.status === 'failed' || booking.payments?.status === 'failed') {
    return new Date(booking.created_at).getTime() >= Date.now() - FAILED_LOOKBACK_MS;
  }
  return false;
}

export function bookingDisplayStatus(booking: Pick<AmenityBookingWithPayment, 'status' | 'payments'>) {
  if (booking.status === 'failed' || booking.payments?.status === 'failed') return 'failed' as const;
  return booking.status;
}

export function bookingStatusLabel(status: BookingStatus | 'failed') {
  switch (status) {
    case 'failed':
      return i18n.t('resident.payments.paymentFailed');
    case 'pending':
      return i18n.t('resident.amenities.pendingPayment');
    case 'confirmed':
      return i18n.t('resident.amenities.confirmed');
    case 'completed':
      return i18n.t('resident.amenities.completed');
    case 'cancelled':
      return i18n.t('resident.amenities.cancelled');
    default:
      return status;
  }
}

export function bookingStatusTone(status: BookingStatus | 'failed'): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    case 'cancelled':
      return 'neutral';
    default:
      return 'info';
  }
}

export function bookingStatusIcon(
  status: BookingStatus | 'failed',
): 'check_circle' | 'schedule' | 'error_outline' | 'cancel' | undefined {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'check_circle';
    case 'pending':
      return 'schedule';
    case 'failed':
      return 'error_outline';
    case 'cancelled':
      return 'cancel';
    default:
      return undefined;
  }
}
