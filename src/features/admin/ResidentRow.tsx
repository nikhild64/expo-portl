import { Pressable, View } from 'react-native';

import { Card, StatusPill, Text } from '@/components';
import { titleize } from '@/lib/format';
import type { ResidentWithFlats } from '@/queries/useAdminResidents';

const statusTone: Record<ResidentWithFlats['status'], 'success' | 'warning' | 'danger'> = {
  active: 'success',
  blocked: 'danger',
  pending: 'warning',
};

interface Props {
  resident: ResidentWithFlats;
  onPress?: () => void;
}

export function ResidentRow({ resident, onPress }: Props) {
  const flatLabel = resident.flat_residents
    ?.map((link) => `${link.flats?.towers?.name ?? 'Tower'}-${link.flats?.number ?? link.flat_id.slice(0, 4)}`)
    .join(', ');

  return (
    <Pressable onPress={onPress}>
      <Card variant="outlined" className="gap-sm">
        <View className="flex-row items-start justify-between gap-md">
          <View className="flex-1">
            <Text variant="headline">{resident.full_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {resident.phone ?? 'No phone'}{flatLabel ? ` - ${flatLabel}` : ''}
            </Text>
          </View>
          <StatusPill tone={statusTone[resident.status]} label={titleize(resident.status)} />
        </View>
      </Card>
    </Pressable>
  );
}
