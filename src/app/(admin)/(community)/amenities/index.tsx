
import { alert } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Screen, ScreenLoading } from '@/components';
import { AmenityForm, type AmenityFormValues } from '@/features/admin/AmenityForm';
import { AmenityCard } from '@/features/amenities/AmenityCard';
import { useAdminAmenities, useUpsertAmenity } from '@/queries/useAmenityMutations';
import { useAuthStore } from '@/stores/authStore';

export default function AdminAmenitiesScreen() {
  const { t } = useTranslation();
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
      alert(t('alert.titles.amenitySaved'));
    } catch (error) {
      alert(t('alert.titles.saveFailed'), error instanceof Error ? error.message : t('common.pleaseTryAgain'));
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <AmenityForm loading={upsertAmenity.isPending} onSubmit={save} />
      {amenities.map((amenity) => (
        <AmenityCard key={amenity.id} amenity={amenity} onPress={() => router.push(`/(admin)/(community)/amenities/${amenity.id}`)} />
      ))}
      <Button label={t('nav.screens.bookings')} variant="tonal" icon="calendar_today" onPress={() => amenities[0] && router.push(`/(admin)/(community)/amenities/${amenities[0].id}/bookings`)} />
    </Screen>
  );
}
