import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Card, IconSymbol, Text, type IconName } from '@/components';
import type { Tables } from '@/types/database';

type VisitorType = Tables<'visitors'>['type'];

const entryTypes: { label: string; value: VisitorType; icon: IconName }[] = [
  { label: 'Guest', value: 'guest', icon: 'person' },
  { label: 'Delivery', value: 'delivery', icon: 'local_shipping' },
  { label: 'Cab', value: 'cab', icon: 'directions_car' },
  { label: 'Service', value: 'service', icon: 'construction' },
];

interface Props {
  compact?: boolean;
}

export function EntryTypeGrid({ compact = false }: Props) {
  return (
    <View className="gap-md">
      {!compact && (
        <Text variant="caption" color="textSecondary">
          ADD NEW ENTRY
        </Text>
      )}
      <View className="flex-row flex-wrap gap-md">
        {entryTypes.map((entry) => (
          <Pressable
            key={entry.value}
            className="w-[47%]"
            onPress={() => router.push(`/(guard)/(add)/new?type=${entry.value}` as Href)}
            android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
          >
            <Card variant="outlined" className="items-center gap-sm bg-surface-secondary" style={{ minHeight: 104 }}>
              <IconSymbol name={entry.icon} size={34} color="coral" />
              <Text variant="headline">{entry.label}</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export { entryTypes };
