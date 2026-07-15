import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button, Sheet, StatusPill, Text, type SheetHandle } from '@/components';
import {
  bookingDisplayStatus,
  bookingStatusIcon,
  bookingStatusLabel,
  bookingStatusTone,
  isBookingPaymentFailed,
  type AmenityBookingWithPayment,
} from '@/features/amenities/bookingStatus';
import { formatDateTime, formatMoney, formatTimeRange } from '@/lib/format';

export interface BookingDetailSheetHandle {
  open: (booking: AmenityBookingWithPayment) => void;
  close: () => void;
}

interface Props {
  onBookAgain?: (amenityId: string) => void;
}

function BookingDetailContent({
  booking,
  bottomInset,
  onBookAgain,
  onClose,
}: {
  booking: AmenityBookingWithPayment;
  bottomInset: number;
  onBookAgain?: (amenityId: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const displayStatus = bookingDisplayStatus(booking);
  const failed = isBookingPaymentFailed(booking);

  return (
    <View className="gap-lg" style={{ paddingBottom: bottomInset }}>
      <View className="gap-sm">
        <Text variant="headline">{t('resident.amenities.bookingDetails')}</Text>
        <View className="flex-row items-start justify-between gap-sm">
          <Text variant="titleLarge" className="flex-1">
            {booking.amenities?.name ?? t('resident.amenities.amenityBooking')}
          </Text>
          <StatusPill
            tone={bookingStatusTone(displayStatus)}
            label={bookingStatusLabel(displayStatus)}
            icon={bookingStatusIcon(displayStatus)}
          />
        </View>
      </View>

      <View className="gap-md rounded-lg border border-border bg-surface-secondary p-base">
        <View className="gap-xs">
          <Text variant="caption" color="textSecondary">
            {t('resident.amenities.when')}
          </Text>
          <Text variant="body">{formatDateTime(booking.start_at)}</Text>
          <Text variant="footnote" color="textSecondary">
            {formatTimeRange(booking.start_at, booking.end_at)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between border-t border-border pt-md">
          <Text variant="headline">{t('common.total')}</Text>
          <Text variant="titleLarge">{formatMoney(booking.total_amount)}</Text>
        </View>
      </View>

      {failed ? (
        <Text variant="footnote" color="error">
          {t('resident.amenities.paymentFailedRetry')}
        </Text>
      ) : null}

      <View className="gap-sm">
        {failed && onBookAgain ? (
          <Button
            label={t('resident.amenities.bookAgain')}
            icon="event"
            full
            onPress={() => {
              onClose();
              onBookAgain(booking.amenity_id);
            }}
          />
        ) : null}
        <Button label={t('common.close')} variant="tonal" full onPress={onClose} />
      </View>
    </View>
  );
}

export const BookingDetailSheet = forwardRef<BookingDetailSheetHandle, Props>(function BookingDetailSheet(
  { onBookAgain },
  ref,
) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<SheetHandle>(null);
  const [booking, setBooking] = useState<AmenityBookingWithPayment | null>(null);
  const bottomInset = Math.max(insets.bottom, 16);

  useImperativeHandle(ref, () => ({
    open: (nextBooking) => {
      setBooking(nextBooking);
      setTimeout(() => sheetRef.current?.present(), 0);
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  return (
    <Sheet ref={sheetRef} snapPoints={['55%', '85%']}>
      {booking ? (
        <BookingDetailContent
          booking={booking}
          bottomInset={bottomInset}
          onBookAgain={onBookAgain}
          onClose={() => sheetRef.current?.dismiss()}
        />
      ) : null}
    </Sheet>
  );
});
