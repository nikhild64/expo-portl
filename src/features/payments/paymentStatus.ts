import i18n from '@/i18n';
import { createStatusDisplay } from '@/lib/statusDisplay';

export type PaymentDisplayStatus = 'processing' | 'failed' | 'paid' | 'cancelled' | 'clear';

const paymentStatus = createStatusDisplay<PaymentDisplayStatus>({
  processing: {
    label: () => i18n.t('resident.payments.processing'),
    tone: 'warning',
    icon: 'schedule',
  },
  failed: {
    label: () => i18n.t('resident.payments.paymentFailed'),
    tone: 'danger',
    icon: 'error_outline',
  },
  paid: {
    label: () => i18n.t('resident.payments.paid'),
    tone: 'success',
    icon: 'check_circle',
  },
  cancelled: {
    label: () => i18n.t('resident.payments.cancelledStatus'),
    tone: 'neutral',
    icon: 'cancel',
  },
  clear: {
    label: () => i18n.t('resident.payments.clear'),
    tone: 'success',
    icon: 'check_circle',
  },
});

export const paymentStatusLabel = paymentStatus.label;
export const paymentStatusTone = paymentStatus.tone;
export const paymentStatusIcon = paymentStatus.icon;
