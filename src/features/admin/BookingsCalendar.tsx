import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, StatusPill, Text } from '@/components';
import { bookingDisplayStatus, bookingStatusIcon, bookingStatusLabel, bookingStatusTone } from '@/features/amenities/bookingStatus';
import { formatDateTime, formatFlatLabel } from '@/lib/format';
import type { Tables } from '@/types/database';

type Booking = Tables<'amenity_bookings'> & {
  flats?: { number: string; towers?: { name: string } | null } | null;
  profiles?: { full_name: string } | null;
  payments?: { status: Tables<'payments'>['status'] } | null;
};

interface Props {
  bookings: Booking[];
  onCancel: (id: string) => void;
}

export function BookingsCalendar({ bookings, onCancel }: Props) {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const month = new Date();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const bookingsForDay = bookings.filter((booking) => {
    const d = new Date(booking.start_at);
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth() && d.getDate() === selectedDay;
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">{t('admin.community.bookingsCalendar')}</Text>
      <View className="flex-row flex-wrap gap-xs">
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const hasBooking = bookings.some((booking) => {
            const d = new Date(booking.start_at);
            return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth() && d.getDate() === day;
          });
          return (
            <Button
              key={day}
              label={String(day)}
              size="sm"
              variant={selectedDay === day ? 'filled' : hasBooking ? 'tonal' : 'outlined'}
              onPress={() => setSelectedDay(day)}
            />
          );
        })}
      </View>
      <View className="gap-sm">
        {bookingsForDay.map((booking) => {
          const displayStatus = bookingDisplayStatus(booking);
          return (
          <View key={booking.id} className="gap-xs rounded-md border border-border p-sm">
            <Text variant="body">
              {booking.profiles?.full_name ?? t('nav.screens.resident')} - {formatFlatLabel(booking.flats?.towers?.name, booking.flats?.number, '')}
            </Text>
            <View className="flex-row items-center justify-between gap-sm">
              <Text variant="footnote" color="textSecondary">
                {formatDateTime(booking.start_at)}
              </Text>
              <StatusPill
                tone={bookingStatusTone(displayStatus)}
                label={bookingStatusLabel(displayStatus)}
                icon={bookingStatusIcon(displayStatus)}
              />
            </View>
            {booking.status === 'confirmed' || booking.status === 'pending' ? (
              <Button label={t('admin.community.cancelBooking')} size="sm" variant="outlined" onPress={() => onCancel(booking.id)} />
            ) : null}
          </View>
          );
        })}
        {!bookingsForDay.length && (
          <Text variant="body" color="textSecondary">
            {t('admin.community.noBookingsDate')}
          </Text>
        )}
      </View>
    </Card>
  );
}
