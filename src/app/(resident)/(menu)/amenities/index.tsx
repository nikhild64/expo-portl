import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, Field, Screen, StatusPill, Text } from '@/components';
import { AmenityCard } from '@/features/amenities/AmenityCard';
import { bookingDisplayStatus, bookingStatusIcon, bookingStatusLabel, bookingStatusTone, isBookingPaymentFailed } from '@/features/amenities/bookingStatus';
import { formatDateTime, formatTimeRange } from '@/lib/format';
import { useResidentNavigation } from '@/lib/useResidentNavigation';
import { useAmenities } from '@/queries/useAmenities';
import { useMyAmenityBookings } from '@/queries/useAmenityBookings';
import { useAuthStore } from '@/stores/authStore';

export default function AmenitiesScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const residentNav = useResidentNavigation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: amenities, isLoading } = useAmenities(societyId);
  const { data: myBookings = [] } = useMyAmenityBookings();

  const openAmenity = useMemo(
    () => (id: string) => residentNav.push('amenities', id),
    [residentNav],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return amenities ?? [];
    return (amenities ?? []).filter((amenity) => amenity.name.toLowerCase().includes(needle));
  }, [amenities, query]);

  const upcomingBookings = myBookings.filter(
    (booking) =>
      ['pending', 'confirmed'].includes(booking.status) &&
      !isBookingPaymentFailed(booking) &&
      new Date(booking.end_at) >= new Date(),
  );
  const failedBookings = myBookings.filter((booking) => isBookingPaymentFailed(booking));

  if (isLoading) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" colorClassName="accent-coral" />
        </View>
      </Screen>
    );
  }

  const [hero, ...rest] = filtered;

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Field
        value={query}
        onChangeText={setQuery}
        placeholder={t('resident.amenities.searchAmenities')}
      />

      {hero ? (
        <>
          <View className="gap-sm">
            <Text variant="caption" color="textSecondary">
              {t('resident.amenities.availableNow')}
            </Text>
            <AmenityCard hero amenity={hero} onPress={() => openAmenity(hero.id)} />
          </View>

          {!!rest.length && (
            <View className="gap-sm">
              <Text variant="caption" color="textSecondary">
                {t('resident.amenities.allAmenities')}
              </Text>
              <View className="flex-row flex-wrap gap-md">
                {rest.map((amenity) => (
                  <View key={amenity.id} className="w-[47%]">
                    <AmenityCard
                      amenity={amenity}
                      compact
                      onPress={() => openAmenity(amenity.id)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      ) : (
        <EmptyState icon="calendar_today" title={t('resident.amenities.noAmenities')} subtitle={t('resident.amenities.noAmenitiesSub')} />
      )}

      {!!upcomingBookings.length && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.amenities.yourBookings')}
          </Text>
          {upcomingBookings.slice(0, 3).map((booking) => {
            const displayStatus = bookingDisplayStatus(booking);
            return (
            <Pressable
              key={booking.id}
              onPress={() => openAmenity(booking.amenity_id)}
            >
              <Card variant="outlined" className="gap-xs">
                <View className="flex-row items-start justify-between gap-sm">
                  <Text variant="headline" className="flex-1">
                    {booking.amenities?.name ?? t('resident.amenities.amenityBooking')}
                  </Text>
                  <StatusPill
                    tone={bookingStatusTone(displayStatus)}
                    label={bookingStatusLabel(displayStatus)}
                    icon={bookingStatusIcon(displayStatus)}
                  />
                </View>
                <Text variant="footnote" color="textSecondary">
                  {formatDateTime(booking.start_at)} · {formatTimeRange(booking.start_at, booking.end_at)}
                </Text>
              </Card>
            </Pressable>
            );
          })}
        </View>
      )}

      {!!failedBookings.length && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.amenities.failedPayments')}
          </Text>
          {failedBookings.slice(0, 3).map((booking) => (
            <Pressable
              key={booking.id}
              onPress={() => openAmenity(booking.amenity_id)}
            >
              <Card variant="outlined" className="gap-xs">
                <View className="flex-row items-start justify-between gap-sm">
                  <Text variant="headline" className="flex-1">
                    {booking.amenities?.name ?? t('resident.amenities.amenityBooking')}
                  </Text>
                  <StatusPill
                    tone="danger"
                    label={t('resident.payments.paymentFailed')}
                    icon="error_outline"
                  />
                </View>
                <Text variant="footnote" color="textSecondary">
                  {formatDateTime(booking.start_at)} · {formatTimeRange(booking.start_at, booking.end_at)}
                </Text>
                <Text variant="footnote" color="error">
                  {t('resident.amenities.paymentFailedRetry')}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
