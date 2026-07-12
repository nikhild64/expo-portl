import { View } from 'react-native';

import { Chip, Text } from '@/components';
import type { Tables } from '@/types/database';

const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

interface Props {
  bookings: Tables<'amenity_bookings'>[];
  date: Date;
  onChange: (hours: number[]) => void;
  selectedHours: number[];
}

function isBooked(hour: number, date: Date, bookings: Tables<'amenity_bookings'>[]) {
  const slot = new Date(date);
  slot.setHours(hour, 0, 0, 0);
  return bookings.some((booking) => {
    const start = new Date(booking.start_at);
    const end = new Date(booking.end_at);
    return slot >= start && slot < end;
  });
}

export function SlotPicker({ bookings, date, onChange, selectedHours }: Props) {
  const toggle = (hour: number) => {
    onChange(selectedHours.includes(hour) ? selectedHours.filter((item) => item !== hour) : [...selectedHours, hour].sort());
  };

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        AVAILABLE SLOTS
      </Text>
      <View className="flex-row flex-wrap gap-sm">
        {hours.map((hour) => {
          const booked = isBooked(hour, date, bookings);
          return (
            <Chip
              key={hour}
              label={`${hour}:00`}
              selected={selectedHours.includes(hour)}
              onPress={booked ? undefined : () => toggle(hour)}
              className={booked ? 'opacity-40' : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}
