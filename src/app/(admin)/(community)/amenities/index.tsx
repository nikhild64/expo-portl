
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, Screen, ScreenLoading } from '@/components';
import { AmenityCard } from '@/features/amenities/AmenityCard';
import { useAdminAmenities } from '@/queries/useAmenityMutations';
import { useAuthStore } from '@/stores/authStore';

export default function AdminAmenitiesScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: amenities = [], isLoading } = useAdminAmenities(societyId);

  if (isLoading) return <ScreenLoading variant="tab" />;

  return (
    <Screen scroll variant="tab">
      <Button
        label={t('admin.community.newAmenity')}
        icon="add"
        onPress={() => router.push('/(admin)/(community)/amenities/new')}
      />
      {amenities.map((amenity) => (
        <AmenityCard
          key={amenity.id}
          amenity={amenity}
          onPress={() => router.push(`/(admin)/(community)/amenities/${amenity.id}`)}
          onBookingsPress={() =>
            router.push({
              pathname: '/(admin)/(community)/amenities/[id]/bookings',
              params: { id: amenity.id },
            })
          }
        />
      ))}
      {!amenities.length && (
        <EmptyState
          icon="event_seat"
          title={t('admin.community.noAmenities')}
          subtitle={t('admin.community.noAmenitiesSub')}
        />
      )}
    </Screen>
  );
}
