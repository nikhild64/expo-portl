import { Pressable, ScrollView, View } from 'react-native';
import { format } from 'date-fns';

import { Text } from '@/components';

interface Props {
  availableFrom?: string;
  availableTo?: string;
  bookings: { start_at: string; end_at: string }[];
  date: Date;
  onChange: (hours: number[]) => void;
  selectedHours: number[];
}

function isBooked(hour: number, date: Date, bookings: { start_at: string; end_at: string }[]) {
  const slot = new Date(date);
  slot.setHours(hour, 0, 0, 0);
  return bookings.some((booking) => {
    const start = new Date(booking.start_at);
    const end = new Date(booking.end_at);
    return slot >= start && slot < end;
  });
}

function formatHour(hour: number) {
  const slot = new Date();
  slot.setHours(hour, 0, 0, 0);
  return format(slot, 'h:mm a');
}

export function SlotPicker({ availableFrom = '08:00', availableTo = '20:00', bookings, date, onChange, selectedHours }: Props) {
  const startHour = parseInt(availableFrom.split(':')[0], 10);
  const endHour = parseInt(availableTo.split(':')[0], 10);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const toggle = (hour: number) => {
    onChange(selectedHours.includes(hour) ? selectedHours.filter((item) => item !== hour) : [...selectedHours, hour].sort());
  };

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        SELECT TIME SLOT
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {hours.map((hour) => {
          const booked = isBooked(hour, date, bookings);
          const selected = selectedHours.includes(hour);

          return (
            <Pressable
              key={hour}
              disabled={booked}
              onPress={() => toggle(hour)}
              className={`items-center rounded-md px-md py-sm${selected ? ' bg-coral' : booked ? ' bg-surface-tertiary opacity-50' : ' bg-surface-secondary'}`}
              style={{ borderCurve: 'continuous', minWidth: 88 }}
            >
              <Text variant="subhead" color={selected ? 'onPrimary' : 'textPrimary'}>
                {formatHour(hour)}
              </Text>
              {booked && (
                <Text variant="caption" color="textTertiary">
                  Booked
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
