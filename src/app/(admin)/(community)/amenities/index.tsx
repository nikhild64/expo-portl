import { Alert } from 'react-native';
import { router, type Href } from 'expo-router';

import { Button, Screen, ScreenLoading } from '@/components';
import { AmenityForm, type AmenityFormValues } from '@/features/admin/AmenityForm';
import { AmenityCard } from '@/features/amenities/AmenityCard';
import { useAdminAmenities, useUpsertAmenity } from '@/queries/useAmenityMutations';
import { useAuthStore } from '@/stores/authStore';

export default function AdminAmenitiesScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: amenities = [], isLoading } = useAdminAmenities(societyId);
  const upsertAmenity = useUpsertAmenity();

  if (isLoading) return <ScreenLoading safe={false} />;

  const save = async (values: AmenityFormValues) => {
    if (!societyId) return;
    try {
      await upsertAmenity.mutateAsync({
        active: values.active,
        available_from: values.availableFrom,
        available_to: values.availableTo,
        blackout_dates: [],
        capacity: values.capacity ?? null,
        cover_image_url: values.coverImageUrl || null,
        daily_price: values.dailyPrice ?? 0,
        description: values.description || null,
        hourly_price: values.hourlyPrice ?? 0,
        name: values.name,
        rules_text: values.rulesText || null,
        society_id: societyId,
      });
      Alert.alert('Amenity saved');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <AmenityForm loading={upsertAmenity.isPending} onSubmit={save} />
      {amenities.map((amenity) => (
        <AmenityCard key={amenity.id} amenity={amenity} onPress={() => router.push(`/(admin)/(community)/amenities/${amenity.id}` as Href)} />
      ))}
      <Button label="Bookings" variant="tonal" icon="calendar_today" onPress={() => amenities[0] && router.push(`/(admin)/(community)/amenities/${amenities[0].id}/bookings` as Href)} />
    </Screen>
  );
}
