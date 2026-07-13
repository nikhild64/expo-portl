import { useRef } from 'react';
import { Pressable, View } from 'react-native';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { PaymentReceiptSheet, type PaymentReceiptSheetHandle } from '@/features/payments/PaymentReceiptSheet';
import { formatDate, formatDuesPeriod, formatMoney, formatTimeRange } from '@/lib/format';
import type { LabeledPayment } from '@/queries/useDues';
import type { CancelledAmenityBooking } from '@/queries/useAmenityBookings';
import type { Tables } from '@/types/database';

interface Props {
  dues: Tables<'dues'>[];
  pendingPayments?: LabeledPayment[];
  failedPayments?: LabeledPayment[];
  cancelledBookings?: CancelledAmenityBooking[];
}

export function PastPayments({
  dues,
  pendingPayments = [],
  failedPayments = [],
  cancelledBookings = [],
}: Props) {
  const receiptRef = useRef<PaymentReceiptSheetHandle>(null);

  const failedBookingIds = new Set(
    failedPayments
      .filter((payment) => payment.purpose === 'amenity' && payment.reference_id)
      .map((payment) => payment.reference_id!),
  );
  const visibleCancelled = cancelledBookings.filter((booking) => !failedBookingIds.has(booking.id));
  const cancelledBookingIds = new Set(visibleCancelled.map((booking) => booking.id));
  const visiblePending = pendingPayments.filter(
    (payment) =>
      !(payment.purpose === 'amenity' && payment.reference_id && cancelledBookingIds.has(payment.reference_id)),
  );

  return (
    <View className="gap-lg">
      {visiblePending.length > 0 && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            PROCESSING
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
                    Submitted {formatDate(payment.created_at)}
                  </Text>
                </View>
                <View className="items-end gap-xs">
                  <Text variant="headline">{formatMoney(payment.amount)}</Text>
                  <StatusPill tone="warning" label="Processing" />
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {failedPayments.length > 0 && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            FAILED
          </Text>
          <Card padding="none" accent="danger" className="overflow-hidden">
            {failedPayments.map((payment) => (
              <View key={payment.id} className="flex-row items-center gap-md px-base py-md bg-surface">
                <IconSymbol name="error_outline" color="error" />
                <View className="flex-1 gap-xs">
                  <Text variant="headline">
                    {payment.purpose === 'dues' ? formatDuesPeriod(payment.label) : payment.label}
                  </Text>
                  <Text variant="footnote" color="textSecondary">
                    {payment.purpose === 'amenity' ? 'Amenity booking' : 'Maintenance dues'} ·{' '}
                    {formatDate(payment.created_at)}
                  </Text>
                  <Text variant="footnote" color="error">
                    Payment did not go through. You can try again.
                  </Text>
                </View>
                <View className="items-end gap-xs">
                  <Text variant="headline">{formatMoney(payment.amount)}</Text>
                  <StatusPill tone="danger" label="Failed" />
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {visibleCancelled.length > 0 && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            CANCELLED
          </Text>
          <Card padding="none" className="overflow-hidden">
            {visibleCancelled.map((booking) => (
              <View key={booking.id} className="flex-row items-center gap-md px-base py-md bg-surface">
                <IconSymbol name="cancel" color="textSecondary" />
                <View className="flex-1 gap-xs">
                  <Text variant="headline">{booking.amenities?.name ?? 'Amenity booking'}</Text>
                  <Text variant="footnote" color="textSecondary">
                    Amenity booking · {formatDate(booking.created_at)}
                  </Text>
                  <Text variant="footnote" color="textSecondary">
                    {formatTimeRange(booking.start_at, booking.end_at)} — checkout was not completed.
                  </Text>
                </View>
                <View className="items-end gap-xs">
                  <Text variant="headline">{formatMoney(booking.total_amount)}</Text>
                  <StatusPill tone="neutral" label="Cancelled" icon="cancel" />
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View className="gap-sm">
        <Text variant="headline">Previous months</Text>
        <Card padding="none" variant="outlined" className="overflow-hidden">
          {dues.length ? (
            dues.map((due, index) => (
              <Pressable
                key={due.id}
                className={`gap-sm px-base py-md bg-surface${index < dues.length - 1 ? ' border-b border-border' : ''}`}
                onPress={() => receiptRef.current?.open(due)}
                accessibilityRole="button"
                accessibilityLabel={`View receipt for ${formatDuesPeriod(due.period)}`}
              >
                <View className="flex-row items-center justify-between gap-md">
                  <Text variant="headline">{formatDuesPeriod(due.period)}</Text>
                  <View className="flex-row items-center gap-sm">
                    <Text variant="headline">{formatMoney(due.total)}</Text>
                    <IconSymbol name="chevron_right" color="textTertiary" size={20} />
                  </View>
                </View>
                <View className="flex-row items-center gap-sm">
                  <StatusPill tone="success" label="Paid" />
                  <View className="h-7 w-7 items-center justify-center rounded-pill bg-success">
                    <IconSymbol name="check_circle" size={16} color="onPrimary" />
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <View className="p-base">
              <Text variant="body" color="textSecondary">
                {visiblePending.length ? 'Confirmed payments will appear here once verified.' : 'No paid dues yet.'}
              </Text>
            </View>
          )}
        </Card>
      </View>

      <PaymentReceiptSheet ref={receiptRef} />
    </View>
  );
}
