import { ActivityIndicator, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { EmptyState, Screen, Text } from '@/components';
import { AmenityCard } from '@/features/amenities/AmenityCard';
import { useAmenities } from '@/queries/useAmenities';
import { useAuthStore } from '@/stores/authStore';

export default function AmenitiesScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: amenities, isLoading } = useAmenities(societyId);

  if (isLoading) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" colorClassName="accent-coral" />
        </View>
      </Screen>
    );
  }
  const [hero, ...rest] = amenities ?? [];

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      {hero ? (
        <>
          <View className="gap-sm">
            <Text variant="caption" color="textSecondary">
              FEATURED
            </Text>
            <AmenityCard hero amenity={hero} onPress={() => router.push(`/(resident)/(menu)/amenities/${hero.id}` as Href)} />
          </View>

          <View className="gap-sm">
            <Text variant="caption" color="textSecondary">
              ALL AMENITIES
            </Text>
            <View className="gap-md">
              {rest.map((amenity) => (
                <AmenityCard
                  key={amenity.id}
                  amenity={amenity}
                  onPress={() => router.push(`/(resident)/(menu)/amenities/${amenity.id}` as Href)}
                />
              ))}
            </View>
          </View>
        </>
      ) : (
        <EmptyState icon="calendar_today" title="No amenities" subtitle="Bookable amenities will appear here." />
      )}
    </Screen>
  );
}
