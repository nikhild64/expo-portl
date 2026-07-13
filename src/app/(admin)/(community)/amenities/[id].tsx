
import { alert } from '@/lib/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Screen, ScreenLoading } from '@/components';
import { AmenityForm, type AmenityFormValues } from '@/features/admin/AmenityForm';
import { useAmenity } from '@/queries/useAmenities';
import { useDeleteAmenity, useUpsertAmenity } from '@/queries/useAmenityMutations';

export default function AdminAmenityDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: amenity, isLoading } = useAmenity(id);
  const upsertAmenity = useUpsertAmenity();
  const deleteAmenity = useDeleteAmenity();

  if (isLoading || !amenity) return <ScreenLoading safe={false} />;

  const save = async (values: AmenityFormValues) => {
    await upsertAmenity.mutateAsync({
      active: values.active,
      available_from: values.availableFrom,
      available_to: values.availableTo,
      capacity: values.capacity ?? null,
      cover_image_url: values.coverImageUrl || null,
      daily_price: values.dailyPrice ?? 0,
      description: values.description || null,
      hourly_price: values.hourlyPrice ?? 0,
      id: amenity.id,
      name: values.name,
      rules_text: values.rulesText || null,
    });
    alert(t('alert.titles.amenityUpdated'));
  };

  const remove = () => {
    alert(t('alert.titles.deleteAmenity'), t('alert.messages.existingBookings'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteAmenity.mutateAsync(amenity.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <AmenityForm amenity={amenity} loading={upsertAmenity.isPending} onSubmit={save} />
      <Button
        label={t('admin.community.bookingsCalendar')}
        icon="calendar_today"
        variant="tonal"
        onPress={() =>
          router.push({
            pathname: '/(admin)/(community)/amenities/[id]/bookings',
            params: { id: amenity.id },
          })
        }
      />
      <Button label={`${t('common.delete')} ${t('nav.screens.amenity').toLowerCase()}`} variant="danger" icon="delete" loading={deleteAmenity.isPending} onPress={remove} />
    </Screen>
  );
}
