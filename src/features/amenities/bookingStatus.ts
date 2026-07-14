import i18n from '@/i18n';
import { createStatusDisplay } from '@/lib/statusDisplay';
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

type BookingDisplayStatus = BookingStatus | 'failed';

const bookingStatus = createStatusDisplay<BookingDisplayStatus>({
  failed: {
    label: () => i18n.t('resident.payments.paymentFailed'),
    tone: 'danger',
    icon: 'error_outline',
  },
  pending: {
    label: () => i18n.t('resident.amenities.pendingPayment'),
    tone: 'warning',
    icon: 'schedule',
  },
  confirmed: {
    label: () => i18n.t('resident.amenities.confirmed'),
    tone: 'success',
    icon: 'check_circle',
  },
  completed: {
    label: () => i18n.t('resident.amenities.completed'),
    tone: 'success',
    icon: 'check_circle',
  },
  cancelled: {
    label: () => i18n.t('resident.amenities.cancelled'),
    tone: 'neutral',
    icon: 'cancel',
  },
});

export const bookingStatusLabel = bookingStatus.label;
export const bookingStatusTone = bookingStatus.tone;
export const bookingStatusIcon = bookingStatus.icon;
