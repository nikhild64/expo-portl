import { useLocalSearchParams } from 'expo-router';

import { Screen, SkeletonCard } from '@/components';
import { BookingsCalendar } from '@/features/admin/BookingsCalendar';
import { useAdminAmenityBookings, useCancelAmenityBooking } from '@/queries/useAmenityMutations';

export default function AdminAmenityBookingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bookings = [], isLoading } = useAdminAmenityBookings(id);
  const cancelBooking = useCancelAmenityBooking();

  if (isLoading) return <SkeletonCard />;

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <BookingsCalendar bookings={bookings} onCancel={(bookingId) => cancelBooking.mutate(bookingId)} />
    </Screen>
  );
}
