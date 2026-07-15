
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, Screen, ScreenLoading } from '@/components';
import { AmenityCard } from '@/features/amenities/AmenityCard';
import { useAdminNavigation } from '@/lib/useAdminNavigation';
import { useAdminAmenities } from '@/queries/useAmenityMutations';
import { useAuthStore } from '@/stores/authStore';

export default function AdminAmenitiesScreen() {
  const { t } = useTranslation();
  const adminNav = useAdminNavigation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: amenities = [], isLoading } = useAdminAmenities(societyId);

  if (isLoading) return <ScreenLoading variant="tab" />;

  return (
    <Screen scroll variant="tab">
      <Button
        label={t('admin.community.newAmenity')}
        icon="add"
        onPress={() => adminNav.push('amenities/new')}
      />
      {amenities.map((amenity) => (
        <AmenityCard
          key={amenity.id}
          amenity={amenity}
          onPress={() => adminNav.push('amenities', amenity.id)}
          onBookingsPress={() => adminNav.push('amenities', amenity.id, 'bookings')}
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
