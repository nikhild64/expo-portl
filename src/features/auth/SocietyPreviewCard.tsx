import { Image, View } from 'react-native';

import { Card, IconSymbol, Text } from '@/components';
import { useSocietyStats } from '@/queries/useSocietyStats';
import type { Database } from '@/types/database';

type Society = Database['public']['Tables']['societies']['Row'];

const PLACEHOLDER = require('../../../assets/images/society-placeholder.png');

interface Props {
  society: Society;
}

function formatLocation(society: Society) {
  const parts = [society.address, society.city].filter(Boolean);
  return parts.join(', ');
}

export function SocietyPreviewCard({ society }: Props) {
  const { data: stats } = useSocietyStats(society.id, society.created_at);
  const imageSource = society.logo_url ? { uri: society.logo_url } : PLACEHOLDER;

  return (
    <Card variant="filled" className="gap-md">
      <View className="flex-row gap-md">
        <Image
          source={imageSource}
          className="h-16 w-16 rounded-md bg-surface-secondary"
          accessibilityIgnoresInvertColors
        />
        <View className="flex-1 gap-xs">
          <Text variant="headline">{society.name}</Text>
          {formatLocation(society) ? (
            <Text variant="footnote" color="textSecondary">
              {formatLocation(society)}
            </Text>
          ) : null}
        </View>
      </View>

      {stats ? (
        <View className="flex-row flex-wrap gap-sm">
          <StatChip icon="groups" label={`${stats.residentCount} residents`} />
          <StatChip icon="apartment" label={`${stats.towerCount} towers`} />
          <StatChip icon="calendar_today" label={`Since ${stats.sinceYear}`} />
        </View>
      ) : null}

      <View className="flex-row items-center gap-xs">
        <IconSymbol name="check_circle" size={16} color="success" />
        <Text variant="footnote" color="success">
          Verified society
        </Text>
      </View>
    </Card>
  );
}

function StatChip({ icon, label }: { icon: 'groups' | 'apartment' | 'calendar_today'; label: string }) {
  return (
    <View className="flex-row items-center gap-xs rounded-pill bg-surface-secondary px-sm py-xs">
      <IconSymbol name={icon} size={14} color="textSecondary" />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}
