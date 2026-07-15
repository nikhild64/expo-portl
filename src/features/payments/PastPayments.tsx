import { useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { PaymentReceiptSheet, type PaymentReceiptSheetHandle } from '@/features/payments/PaymentReceiptSheet';
import { paymentStatusLabel, paymentStatusTone } from '@/features/payments/paymentStatus';
import { formatDate, formatDuesPeriod, formatMoney, formatTimeRange } from '@/lib/format';
import type { LabeledPayment } from '@/queries/useDues';
import type { CancelledAmenityBooking } from '@/queries/useAmenityBookings';
import type { Tables } from '@/types/database';

interface Props {
  dues: Tables<'dues'>[];
  pendingPayments?: LabeledPayment[];
  failedPayments?: LabeledPayment[];
  capturedAmenityPayments?: LabeledPayment[];
  cancelledBookings?: CancelledAmenityBooking[];
}

export function PastPayments({
  dues,
  pendingPayments = [],
  failedPayments = [],
  capturedAmenityPayments = [],
  cancelledBookings = [],
}: Props) {
  const { t } = useTranslation();
  const receiptRef = useRef<PaymentReceiptSheetHandle>(null);

  const failedBookingIds = useMemo(
    () =>
      new Set(
        failedPayments
          .filter((payment) => payment.purpose === 'amenity' && payment.reference_id)
          .map((payment) => payment.reference_id!),
      ),
    [failedPayments],
  );
  const visibleCancelled = useMemo(
    () => cancelledBookings.filter((booking) => !failedBookingIds.has(booking.id)),
    [cancelledBookings, failedBookingIds],
  );
  const cancelledBookingIds = useMemo(
    () => new Set(visibleCancelled.map((booking) => booking.id)),
    [visibleCancelled],
  );
  const visiblePending = useMemo(
    () =>
      pendingPayments.filter(
        (payment) =>
          !(payment.purpose === 'amenity' && payment.reference_id && cancelledBookingIds.has(payment.reference_id)),
      ),
    [cancelledBookingIds, pendingPayments],
  );

  return (
    <View className="gap-lg">
      {visiblePending.length > 0 && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.payments.processingSection')}
          </Text>
          <Card padding="none" className="overflow-hidden">
            {visiblePending.map((payment) => (
              <View key={payment.id} className="flex-row items-center gap-md px-base py-md bg-surface">
                <IconSymbol name="schedule" color="warning" />
                <View className="flex-1">
                  <Text variant="headline">
                    {payment.purpose === 'dues' ? formatDuesPeriod(payment.label) : payment.label}
                  </Text>
                  <Text variant="footnote" color="textSecondary">
                    {t('resident.payments.submitted', { date: formatDate(payment.created_at) })}
                  </Text>
                </View>
                <View className="items-end gap-xs">
                  <Text variant="headline">{formatMoney(payment.amount)}</Text>
                  <StatusPill tone={paymentStatusTone('processing')} label={paymentStatusLabel('processing')} />
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {failedPayments.length > 0 && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.payments.failedSection')}
          </Text>
          {failedPayments.map((payment) => (
            <Card key={payment.id} variant="outlined" className="flex-row items-center gap-md">
              <IconSymbol name="error_outline" color="error" />
              <View className="flex-1 gap-xs">
                <Text variant="headline">
                  {payment.purpose === 'dues' ? formatDuesPeriod(payment.label) : payment.label}
                </Text>
                <Text variant="footnote" color="textSecondary">
                  {payment.purpose === 'amenity' ? t('resident.amenities.amenityBooking') : t('resident.payments.maintenanceDues')} ·{' '}
                  {formatDate(payment.created_at)}
                </Text>
                <Text variant="footnote" color="error">
                  {t('resident.payments.paymentDidNotGoThrough')}
                </Text>
              </View>
              <View className="items-end gap-xs">
                <Text variant="headline">{formatMoney(payment.amount)}</Text>
                <StatusPill tone={paymentStatusTone('failed')} label={paymentStatusLabel('failed')} />
              </View>
            </Card>
          ))}
        </View>
      )}

      {capturedAmenityPayments.length > 0 && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.payments.amenityPaymentsSection')}
          </Text>
          <Card padding="none" className="overflow-hidden">
            {capturedAmenityPayments.map((payment, index) => (
              <View
                key={payment.id}
                className={`flex-row items-center gap-md px-base py-md bg-surface${index < capturedAmenityPayments.length - 1 ? ' border-b border-border' : ''}`}
              >
                <IconSymbol name="check_circle" color="success" />
                <View className="flex-1 gap-xs">
                  <Text variant="headline">{payment.label}</Text>
                  <Text variant="footnote" color="textSecondary">
                    {t('resident.amenities.amenityBooking')} · {formatDate(payment.captured_at ?? payment.created_at)}
                  </Text>
                </View>
                <View className="items-end gap-xs">
                  <Text variant="headline">{formatMoney(payment.amount)}</Text>
                  <StatusPill tone={paymentStatusTone('paid')} label={paymentStatusLabel('paid')} />
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {visibleCancelled.length > 0 && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.payments.cancelled')}
          </Text>
          <Card padding="none" className="overflow-hidden">
            {visibleCancelled.map((booking) => (
              <View key={booking.id} className="flex-row items-center gap-md px-base py-md bg-surface">
                <IconSymbol name="cancel" color="textSecondary" />
                <View className="flex-1 gap-xs">
                  <Text variant="headline">{booking.amenities?.name ?? t('resident.amenities.amenityBooking')}</Text>
                  <Text variant="footnote" color="textSecondary">
                    {t('resident.amenities.amenityBooking')} · {formatDate(booking.created_at)}
                  </Text>
                  <Text variant="footnote" color="textSecondary">
                    {formatTimeRange(booking.start_at, booking.end_at)} — {t('resident.payments.checkoutIncomplete')}
                  </Text>
                </View>
                <View className="items-end gap-xs">
                  <Text variant="headline">{formatMoney(booking.total_amount)}</Text>
                  <StatusPill tone={paymentStatusTone('cancelled')} label={paymentStatusLabel('cancelled')} icon="cancel" />
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View className="gap-sm">
        <Text variant="headline">{t('resident.payments.previousMonths')}</Text>
        <Card padding="none" variant="outlined" className="overflow-hidden">
          {dues.length ? (
            dues.map((due, index) => (
              <Pressable
                key={due.id}
                className={`gap-sm px-base py-md bg-surface${index < dues.length - 1 ? ' border-b border-border' : ''}`}
                onPress={() => receiptRef.current?.open(due)}
                accessibilityRole="button"
                accessibilityLabel={t('resident.payments.paymentReceipt')}
              >
                <View className="flex-row items-center justify-between gap-md">
                  <Text variant="headline">{formatDuesPeriod(due.period)}</Text>
                  <View className="flex-row items-center gap-sm">
                    <Text variant="headline">{formatMoney(due.total)}</Text>
                    <IconSymbol name="chevron_right" color="textTertiary" size={20} />
                  </View>
                </View>
                <View className="flex-row items-center gap-sm">
                  <StatusPill tone={paymentStatusTone('paid')} label={paymentStatusLabel('paid')} />
                  <View className="h-7 w-7 items-center justify-center rounded-pill bg-success">
                    <IconSymbol name="check_circle" size={16} color="onPrimary" />
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <View className="p-base">
              <Text variant="body" color="textSecondary">
                {visiblePending.length ? t('resident.payments.confirmedPaymentsPending') : t('resident.payments.noPaidDues')}
              </Text>
            </View>
          )}
        </Card>
      </View>

      <PaymentReceiptSheet ref={receiptRef} />
    </View>
  );
}
