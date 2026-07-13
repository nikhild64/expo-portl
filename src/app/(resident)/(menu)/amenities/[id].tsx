import { Alert, ScrollView, View } from 'react-native';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, ScreenEmpty, Skeleton, StatusPill, Text } from '@/components';
import { DateStrip } from '@/features/amenities/DateStrip';
import { SlotPicker } from '@/features/amenities/SlotPicker';
import { formatMoney } from '@/lib/format';
import { createOrder, openCheckout } from '@/lib/razorpay';
import { useAmenity } from '@/queries/useAmenities';
import { useAmenityBookings, useCancelAmenityBooking, useCreateAmenityBooking, useFailAmenityBooking } from '@/queries/useAmenityBookings';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useAuthStore } from '@/stores/authStore';

const DEPOSIT_AMOUNT = 500;

export default function AmenityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [date, setDate] = useState(new Date());
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const insets = useSafeAreaInsets();
  const { data: amenity, isLoading, error } = useAmenity(id);
  const { data: bookings = [] } = useAmenityBookings(id, date);
  const { data: primaryFlat } = useMyPrimaryFlat();
  const profile = useAuthStore((s) => s.profile);
  const email = useAuthStore((s) => s.session?.user.email);
  const queryClient = useQueryClient();
  const createBooking = useCreateAmenityBooking();
  const failBooking = useFailAmenityBooking();
  const cancelBooking = useCancelAmenityBooking();

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg p-base pt-12">
        <Skeleton width="100%" height={200} radius="lg" />
        <View className="mt-md gap-md">
          <Skeleton width="70%" height={24} />
          <Skeleton width="95%" height={14} />
        </View>
      </View>
    );
  }

  if (error || !amenity) {
    return <ScreenEmpty safe={false} icon="error_outline" title="Amenity not found" subtitle="This amenity may be unavailable." />;
  }

  const free = (amenity.hourly_price ?? 0) === 0 && (amenity.daily_price ?? 0) === 0;
  const rental = selectedHours.length * (amenity.hourly_price ?? 0);
  const deposit = free ? 0 : DEPOSIT_AMOUNT;
  const total = rental + deposit;

  const confirm = async () => {
    if (!profile?.id || !primaryFlat?.flat_id || !selectedHours.length) return;

    const start = new Date(date);
    start.setHours(selectedHours[0], 0, 0, 0);
    const end = new Date(date);
    end.setHours(selectedHours[selectedHours.length - 1] + 1, 0, 0, 0);

    let bookingId: string | null = null;

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
        const { orderId, keyId } = await createOrder({ amount: total, purpose: 'amenity', referenceId: booking.id });
        await openCheckout({
          amount: total,
          keyId,
          notes: { purpose: 'amenity', referenceId: booking.id },
          orderId,
          prefill: { contact: profile.phone ?? undefined, email: email ?? '', name: profile.full_name },
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['amenity-bookings'] });
      Alert.alert('Booking created', free ? 'Your booking is confirmed.' : 'Payment submitted. Razorpay will confirm the booking shortly.');
      router.back();
    } catch (bookingError) {
      if (bookingId) {
        try {
          await failBooking.mutateAsync(bookingId);
        } catch {
          // Until `failed` exists in DB, fall back to cancelled to release the slot.
          try {
            await cancelBooking.mutateAsync(bookingId);
          } catch {
            // Best effort — release the slot if payment or checkout failed.
          }
        }
      }
      Alert.alert('Booking failed', bookingError instanceof Error ? bookingError.message : 'Please try another slot.');
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
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
              {amenity.description ?? amenity.rules_text ?? 'Review availability and choose your slot.'}
            </Text>
            <View className="flex-row flex-wrap gap-sm">
              {amenity.capacity && <StatusPill tone="neutral" label={`${amenity.capacity} seats`} icon="event_seat" />}
              <StatusPill tone="info" label="AC" />
              <StatusPill tone={free ? 'success' : 'info'} label={free ? 'Free' : `${formatMoney(amenity.hourly_price ?? 0)}/hr`} />
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
            <Text variant="headline">Pricing</Text>
            <Text variant="body" color="textSecondary">
              {selectedHours.length} hour{selectedHours.length === 1 ? '' : 's'} selected
            </Text>
            <View className="gap-xs">
              <View className="flex-row justify-between">
                <Text variant="body" color="textSecondary">
                  Hall rental
                </Text>
                <Text variant="body">{formatMoney(rental)}</Text>
              </View>
              {deposit > 0 && (
                <View className="flex-row justify-between">
                  <Text variant="body" color="textSecondary">
                    Refundable deposit
                  </Text>
                  <Text variant="body">{formatMoney(deposit)}</Text>
                </View>
              )}
              <View className="flex-row justify-between border-t border-border pt-sm">
                <Text variant="headline">Total to pay</Text>
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
          label={free ? 'Confirm booking' : `Confirm booking · ${formatMoney(total)}`}
          icon="lock"
          disabled={!selectedHours.length}
          loading={createBooking.isPending}
          onPress={confirm}
          full
        />
      </View>
    </View>
  );
}
