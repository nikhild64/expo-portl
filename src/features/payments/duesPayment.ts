import type { QueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { TFunction } from 'i18next';

import { alertError } from '@/lib/alert';
import { checkoutAndInvalidate } from '@/lib/razorpay';
import type { Database, Tables } from '@/types/database';

type PaymentPurpose = Database['public']['Enums']['payment_purpose'];

export function formatDueDaysLabel(due: Tables<'dues'>, t: TFunction) {
  const days = Math.ceil((new Date(due.due_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days >= 0) return t('resident.payments.dueInDays', { count: days });
  return t('resident.payments.daysOverdue', { count: Math.abs(days) });
}

const PAYMENT_INVALIDATE_KEYS: Record<'dues' | 'amenity', string[][]> = {
  dues: [['dues'], ['payments', 'pending'], ['payments', 'failed']],
  amenity: [['amenity-bookings']],
};

export async function invalidatePaymentQueries(queryClient: QueryClient) {
  await Promise.all(
    PAYMENT_INVALIDATE_KEYS.dues.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

async function runCheckout(input: {
  amount: number;
  purpose: PaymentPurpose;
  referenceId: string;
  referenceIds?: string[];
  email?: string | null;
  errorTitle: string;
  errorFallback?: string;
  haptics?: 'success' | 'none';
  onFinally?: () => void;
  profile: { full_name: string; phone?: string | null };
  queryClient: QueryClient;
  rethrow?: boolean;
}) {
  const invalidateKey = input.purpose === 'dues' ? 'dues' : 'amenity';

  try {
    await checkoutAndInvalidate({
      amount: input.amount,
      purpose: input.purpose,
      referenceId: input.referenceId,
      referenceIds: input.referenceIds,
      prefill: {
        contact: input.profile.phone ?? undefined,
        email: input.email ?? '',
        name: input.profile.full_name,
      },
      queryClient: input.queryClient,
      invalidateKeys: PAYMENT_INVALIDATE_KEYS[invalidateKey],
    });
    if (input.haptics === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (error) {
    if (input.haptics === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    alertError(input.errorTitle, error, input.errorFallback);
    if (input.rethrow) throw error;
  } finally {
    input.onFinally?.();
  }
}

export async function payDuesCheckout(input: {
  amount: number;
  dues: Tables<'dues'>[];
  email?: string | null;
  onFinally?: () => void;
  profile: { full_name: string; phone?: string | null };
  queryClient: QueryClient;
  t: TFunction;
}) {
  const referenceIds = input.dues.map((due) => due.id);

  await runCheckout({
    amount: input.amount,
    purpose: 'dues',
    referenceId: referenceIds[0],
    referenceIds,
    email: input.email,
    errorTitle: input.t('alert.titles.paymentFailed'),
    haptics: 'success',
    onFinally: input.onFinally,
    profile: input.profile,
    queryClient: input.queryClient,
  });
}

export async function payAmenityCheckout(input: {
  amount: number;
  bookingId: string;
  email?: string | null;
  onFinally?: () => void;
  profile: { full_name: string; phone?: string | null };
  queryClient: QueryClient;
  t: TFunction;
}) {
  await runCheckout({
    amount: input.amount,
    purpose: 'amenity',
    referenceId: input.bookingId,
    email: input.email,
    errorTitle: input.t('alert.titles.bookingFailed'),
    errorFallback: input.t('resident.preapprove.tryAnotherSlot'),
    onFinally: input.onFinally,
    profile: input.profile,
    queryClient: input.queryClient,
    rethrow: true,
  });
}
