import { Alert, View } from 'react-native';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';

import { Button, Card, Screen, ScreenEmpty, Skeleton, StatusPill, Text } from '@/components';
import { DateStrip } from '@/features/amenities/DateStrip';
import { SlotPicker } from '@/features/amenities/SlotPicker';
import { formatMoney } from '@/lib/format';
import { createOrder, openCheckout } from '@/lib/razorpay';
import { useAmenity } from '@/queries/useAmenities';
import { useAmenityBookings, useCreateAmenityBooking } from '@/queries/useAmenityBookings';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useAuthStore } from '@/stores/authStore';

export default function AmenityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [date, setDate] = useState(new Date());
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const { data: amenity, isLoading, error } = useAmenity(id);
  const { data: bookings = [] } = useAmenityBookings(id, date);
  const { data: primaryFlat } = useMyPrimaryFlat();
  const profile = useAuthStore((s) => s.profile);
  const email = useAuthStore((s) => s.session?.user.email);
  const queryClient = useQueryClient();
  const createBooking = useCreateAmenityBooking();

  if (isLoading) {
    return (
      <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
        <Card className="gap-md">
          <Skeleton width="70%" height={24} />
          <Skeleton width="95%" height={14} />
          <Skeleton width="80%" height={14} />
          <View className="flex-row gap-sm">
            <Skeleton width={72} height={28} radius="pill" />
            <Skeleton width={104} height={28} radius="pill" />
          </View>
        </Card>
        <View className="flex-row gap-sm">
          <Skeleton width={68} height={32} radius="pill" />
          <Skeleton width={68} height={32} radius="pill" />
          <Skeleton width={68} height={32} radius="pill" />
        </View>
        <Card className="gap-md">
          <Skeleton width="40%" height={18} />
          <Skeleton width="100%" height={44} radius="md" />
          <Skeleton width="100%" height={44} radius="md" />
        </Card>
      </Screen>
    );
  }

  if (error || !amenity) {
    return <ScreenEmpty safe={false} icon="error_outline" title="Amenity not found" subtitle="This amenity may be unavailable." />;
  }

  const free = (amenity.hourly_price ?? 0) === 0 && (amenity.daily_price ?? 0) === 0;
  const amount = selectedHours.length * (amenity.hourly_price ?? 0);

  const confirm = async () => {
    if (!profile?.id || !primaryFlat?.flat_id || !selectedHours.length) return;

    const start = new Date(date);
    start.setHours(selectedHours[0], 0, 0, 0);
    const end = new Date(date);
    end.setHours(selectedHours[selectedHours.length - 1] + 1, 0, 0, 0);

    try {
      const booking = await createBooking.mutateAsync({
        amenity_id: amenity.id,
        deposit: 0,
        end_at: end.toISOString(),
        flat_id: primaryFlat.flat_id,
        profile_id: profile.id,
        start_at: start.toISOString(),
        status: free ? 'confirmed' : 'pending',
        total_amount: amount,
      });

      if (!free) {
        const { orderId, keyId } = await createOrder({ amount, purpose: 'amenity', referenceId: booking.id });
        await openCheckout({
          amount,
          keyId,
          notes: { purpose: 'amenity', referenceId: booking.id },
          orderId,
          prefill: { contact: profile.phone ?? undefined, email: email ?? '', name: profile.full_name },
        });
        await queryClient.invalidateQueries({ queryKey: ['amenity-bookings'] });
      }

      Alert.alert('Booking created', free ? 'Your booking is confirmed.' : 'Payment submitted. Razorpay will confirm the booking shortly.');
      router.back();
    } catch (bookingError) {
      Alert.alert('Booking failed', bookingError instanceof Error ? bookingError.message : 'Please try another slot.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="gap-sm">
        <Text variant="titleLarge">{amenity.name}</Text>
        <Text variant="body" color="textSecondary">
          {amenity.description ?? amenity.rules_text ?? 'Review availability and choose your slot.'}
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          <StatusPill tone={free ? 'success' : 'info'} label={free ? 'Free' : `${formatMoney(amenity.hourly_price ?? 0)} / hour`} />
          {amenity.capacity && <StatusPill tone="neutral" label={`${amenity.capacity} capacity`} />}
        </View>
      </Card>

      <DateStrip selected={date} onSelect={setDate} />
      <SlotPicker date={date} bookings={bookings} selectedHours={selectedHours} onChange={setSelectedHours} />

      <Card className="gap-sm">
        <Text variant="headline">Pricing</Text>
        <Text variant="body" color="textSecondary">
          {selectedHours.length} hour(s) x {formatMoney(amenity.hourly_price ?? 0)}
        </Text>
        <Text variant="title">{formatMoney(amount)}</Text>
        {!free && <StatusPill tone="info" label="Razorpay payment required" />}
      </Card>

      <Button
        label={free ? 'Confirm booking' : `Pay ${formatMoney(amount)} and book`}
        disabled={!selectedHours.length}
        loading={createBooking.isPending}
        onPress={confirm}
      />
    </Screen>
  );
}
