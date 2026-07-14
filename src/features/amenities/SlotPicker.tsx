import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { formatHourLabel } from '@/lib/format';

interface Props {
  availableFrom?: string;
  availableTo?: string;
  bookings: { start_at: string; end_at: string }[];
  date: Date;
  onChange: (hours: number[]) => void;
  selectedHours: number[];
}

function buildBookedHourSet(date: Date, bookings: { start_at: string; end_at: string }[]) {
  const booked = new Set<number>();
  for (const booking of bookings) {
    const start = new Date(booking.start_at);
    const end = new Date(booking.end_at);
    for (let hour = 0; hour < 24; hour += 1) {
      const slot = new Date(date);
      slot.setHours(hour, 0, 0, 0);
      if (slot >= start && slot < end) booked.add(hour);
    }
  }
  return booked;
}

export function SlotPicker({ availableFrom = '08:00', availableTo = '20:00', bookings, date, onChange, selectedHours }: Props) {
  const { t } = useTranslation();
  const startHour = parseInt(availableFrom.split(':')[0], 10);
  const endHour = parseInt(availableTo.split(':')[0], 10);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const bookedHours = useMemo(() => buildBookedHourSet(date, bookings), [bookings, date]);

  const toggle = (hour: number) => {
    onChange(selectedHours.includes(hour) ? selectedHours.filter((item) => item !== hour) : [...selectedHours, hour].sort());
  };

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        {t('resident.amenities.selectTimeSlot')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {hours.map((hour) => {
          const booked = bookedHours.has(hour);
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
                {formatHourLabel(hour)}
              </Text>
              {booked && (
                <Text variant="caption" color="textTertiary">
                  {t('resident.amenities.booked')}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
