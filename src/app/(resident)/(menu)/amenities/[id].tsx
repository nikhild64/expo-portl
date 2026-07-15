import { ScrollView, View } from 'react-native';
import { alertError, alertSuccess } from '@/lib/alert';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button, Card, ScreenEmpty, Skeleton, StatusPill, Text } from '@/components';
import { DateStrip } from '@/features/amenities/DateStrip';
import { SlotPicker } from '@/features/amenities/SlotPicker';
import { payAmenityCheckout } from '@/features/payments/duesPayment';
import { formatMoney } from '@/lib/format';
import { useAmenity } from '@/queries/useAmenities';
import { useAmenityBookings, useCancelAmenityBooking, useCreateAmenityBooking, useFailAmenityBooking } from '@/queries/useAmenityBookings';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useAuthStore } from '@/stores/authStore';

async function releaseFailedBooking(
  bookingId: string,
  failBooking: ReturnType<typeof useFailAmenityBooking>,
  cancelBooking: ReturnType<typeof useCancelAmenityBooking>,
) {
  try {
    await failBooking.mutateAsync(bookingId);
  } catch (failError) {
    console.warn('[amenity-booking] failBooking cleanup failed', failError);
    try {
      await cancelBooking.mutateAsync(bookingId);
    } catch (cancelError) {
      console.warn('[amenity-booking] cancelBooking cleanup failed', cancelError);
    }
  }
}

export default function AmenityDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [date, setDate] = useState(new Date());
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 16);
  const { data: amenity, isLoading, error } = useAmenity(id);
  const { data: bookings = [] } = useAmenityBookings(id, date);
  const { data: primaryFlat } = useMyPrimaryFlat();
  const profile = useAuthStore((s) => s.profile);
  const email = useAuthStore((s) => s.session?.user.email);
  const queryClient = useQueryClient();
  const createBooking = useCreateAmenityBooking();
  const failBooking = useFailAmenityBooking();
  const cancelBooking = useCancelAmenityBooking();

  useEffect(() => {
    setSelectedHours([]);
  }, [date.toDateString()]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg p-base" style={{ paddingTop: topInset }}>
        <Skeleton width="100%" height={200} radius="lg" />
        <View className="mt-md gap-md">
          <Skeleton width="70%" height={24} />
          <Skeleton width="95%" height={14} />
        </View>
      </View>
    );
  }

  if (error || !amenity) {
    return (
      <ScreenEmpty
        safe
        icon="error_outline"
        title={t('resident.amenities.amenityNotFound')}
        subtitle={t('resident.amenities.amenityNotFoundSub')}
      />
    );
  }

  const free = (amenity.hourly_price ?? 0) === 0 && (amenity.daily_price ?? 0) === 0;
  const rental = selectedHours.length * (amenity.hourly_price ?? 0);
  const deposit = free ? 0 : (amenity.deposit ?? 0);
  const total = rental + deposit;

  const confirm = async () => {
    if (!profile?.id || !primaryFlat?.flat_id || !selectedHours.length || isConfirming) return;

    const start = new Date(date);
    start.setHours(selectedHours[0], 0, 0, 0);
    const end = new Date(date);
    end.setHours(selectedHours[selectedHours.length - 1] + 1, 0, 0, 0);

    let bookingId: string | null = null;
    setIsConfirming(true);

    try {
      const booking = await createBooking.mutateAsync({
        amenity_id: amenity.id,
        deposit,
        end_at: end.toISOString(),
        flat_id: primaryFlat.flat_id,
        profile_id: profile.id,
        start_at: start.toISOString(),
        status: free ? 'confirmed' : 'pending',
        total_amount: total,
      });
      bookingId = booking.id;

      if (!free) {
        await payAmenityCheckout({
          amount: total,
          bookingId: booking.id,
          email,
          profile,
          queryClient,
          t,
        });
      }
      alertSuccess(
        t('alert.titles.bookingCreated'),
        free ? t('alert.messages.bookingConfirmed') : t('alert.messages.paymentSubmitted'),
      );
      router.back();
    } catch (bookingError) {
      if (bookingId) {
        await releaseFailedBooking(bookingId, failBooking, cancelBooking);
      }
      alertError(
        t('alert.titles.bookingFailed'),
        bookingError,
        t('resident.preapprove.tryAnotherSlot'),
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingTop: topInset, paddingBottom: 120 + insets.bottom }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {amenity.cover_image_url ? (
          <Image source={{ uri: amenity.cover_image_url }} className="h-52 w-full bg-surface-secondary" contentFit="cover" transition={250} />
        ) : null}

        <View className="gap-lg p-base">
          <View className="gap-sm">
            <Text variant="titleLarge">{amenity.name}</Text>
            <Text variant="body" color="textSecondary">
              {amenity.description ?? amenity.rules_text ?? t('resident.amenities.defaultDescription')}
            </Text>
            <View className="flex-row flex-wrap gap-sm">
              {amenity.capacity && (
                <StatusPill tone="neutral" label={t('common.seats', { count: amenity.capacity })} icon="event_seat" />
              )}
              <StatusPill tone="info" label={t('resident.amenities.ac')} />
              <StatusPill
                tone={free ? 'success' : 'info'}
                label={free ? t('common.free') : t('common.perHour', { price: formatMoney(amenity.hourly_price ?? 0) })}
              />
            </View>
          </View>

          <DateStrip selected={date} onSelect={setDate} />
          <SlotPicker
            date={date}
            bookings={bookings}
            selectedHours={selectedHours}
            onChange={setSelectedHours}
            availableFrom={amenity.available_from}
            availableTo={amenity.available_to}
          />

          <Card className="gap-sm">
            <Text variant="headline">{t('resident.amenities.pricing')}</Text>
            <Text variant="body" color="textSecondary">
              {t('resident.amenities.hoursSelected', { count: selectedHours.length })}
            </Text>
            <View className="gap-xs">
              <View className="flex-row justify-between">
                <Text variant="body" color="textSecondary">
                  {t('resident.amenities.hallRental')}
                </Text>
                <Text variant="body">{formatMoney(rental)}</Text>
              </View>
              {deposit > 0 && (
                <View className="flex-row justify-between">
                  <Text variant="body" color="textSecondary">
                    {t('resident.amenities.refundableDeposit')}
                  </Text>
                  <Text variant="body">{formatMoney(deposit)}</Text>
                </View>
              )}
              <View className="flex-row justify-between border-t border-border pt-sm">
                <Text variant="headline">{t('resident.amenities.totalToPay')}</Text>
                <Text variant="headline">{formatMoney(total)}</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t border-border bg-surface px-base pt-sm"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button
          label={
            isConfirming && !free
              ? t('resident.amenities.openingPayment')
              : free
                ? t('resident.amenities.confirmBooking')
                : t('resident.amenities.confirmBookingAmount', { amount: formatMoney(total) })
          }
          icon="lock"
          disabled={!selectedHours.length || isConfirming}
          loading={isConfirming}
          onPress={confirm}
          full
        />
      </View>
    </View>
  );
}
