import { useLocalSearchParams } from 'expo-router';

import { Screen, ScreenLoading } from '@/components';
import { BookingsCalendar } from '@/features/admin/BookingsCalendar';
import { useAdminAmenityBookings } from '@/queries/useAmenityMutations';
import { useCancelAmenityBooking } from '@/queries/useAmenityBookings';

export default function AdminAmenityBookingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bookings = [], isLoading } = useAdminAmenityBookings(id);
  const cancelBooking = useCancelAmenityBooking();

  if (isLoading) return <ScreenLoading variant="tab" />;

  return (
    <Screen scroll variant="tab">
      <BookingsCalendar bookings={bookings} onCancel={(bookingId) => cancelBooking.mutate(bookingId)} />
    </Screen>
  );
}
