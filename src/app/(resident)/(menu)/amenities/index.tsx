import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router, useSegments } from 'expo-router';

import { Card, EmptyState, Field, Screen, Text } from '@/components';
import { AmenityCard } from '@/features/amenities/AmenityCard';
import { formatDateTime, formatTimeRange } from '@/lib/format';
import { residentAmenityDetailHref } from '@/lib/residentRoutes';
import { useAmenities } from '@/queries/useAmenities';
import { useMyAmenityBookings } from '@/queries/useAmenityBookings';
import { useAuthStore } from '@/stores/authStore';

export default function AmenitiesScreen() {
  const [query, setQuery] = useState('');
  const segments = useSegments();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: amenities, isLoading } = useAmenities(societyId);
  const { data: myBookings = [] } = useMyAmenityBookings();

  const openAmenity = useMemo(
    () => (id: string) => router.push(residentAmenityDetailHref(id, segments)),
    [segments],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return amenities ?? [];
    return (amenities ?? []).filter((amenity) => amenity.name.toLowerCase().includes(needle));
  }, [amenities, query]);

  const upcomingBookings = myBookings.filter(
    (booking) => booking.status !== 'cancelled' && new Date(booking.end_at) >= new Date(),
  );

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
        placeholder="Search amenities"
      />

      {hero ? (
        <>
          <View className="gap-sm">
            <Text variant="caption" color="textSecondary">
              AVAILABLE NOW
            </Text>
            <AmenityCard hero amenity={hero} onPress={() => openAmenity(hero.id)} />
          </View>

          {!!rest.length && (
            <View className="gap-sm">
              <Text variant="caption" color="textSecondary">
                ALL AMENITIES
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
        <EmptyState icon="calendar_today" title="No amenities" subtitle="Bookable amenities will appear here." />
      )}

      {!!upcomingBookings.length && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            YOUR BOOKINGS
          </Text>
          {upcomingBookings.slice(0, 3).map((booking) => (
            <Pressable
              key={booking.id}
              onPress={() => openAmenity(booking.amenity_id)}
            >
              <Card variant="outlined" className="gap-xs">
                <Text variant="headline">{booking.amenities?.name ?? 'Amenity booking'}</Text>
                <Text variant="footnote" color="textSecondary">
                  {formatDateTime(booking.start_at)} · {formatTimeRange(booking.start_at, booking.end_at)}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
