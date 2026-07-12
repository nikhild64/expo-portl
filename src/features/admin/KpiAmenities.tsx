import { View } from 'react-native';

import { Text } from '@/components';

import { KpiCard } from './KpiCard';

interface Props {
  usage?: { day: number; count: number; percent: number }[];
}

export function KpiAmenities({ usage = [] }: Props) {
  const total = usage.reduce((sum, row) => sum + row.count, 0);

  return (
    <KpiCard label="Amenities" value={total} subtitle="Bookings this week">
      <View className="flex-row items-end gap-xs">
        {(usage.length ? usage : Array.from({ length: 7 }, (_, day) => ({ day, count: 0, percent: 0 }))).map((row) => (
          <View key={row.day} className="flex-1 items-center gap-xs">
            <View className="w-full rounded-pill bg-coral/20" style={{ height: Math.max(8, row.percent * 0.38) }} />
            <Text variant="caption" color="textTertiary">
              {row.count}
            </Text>
          </View>
        ))}
      </View>
    </KpiCard>
  );
}
