import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Text } from '@/components';
import { formatCompactNumber, titleize } from '@/lib/format';

import { KpiCard } from './KpiCard';

type Breakdown = Record<'low' | 'medium' | 'high' | 'urgent', number>;

interface Props {
  count?: number;
  breakdown?: Breakdown;
}

export function KpiComplaints({ count = 0, breakdown = { low: 0, medium: 0, high: 0, urgent: 0 } }: Props) {
  const coral = useCSSVariable('--color-coral') as string;
  const total = Math.max(1, count);

  return (
    <KpiCard label="Complaints" value={formatCompactNumber(count)} subtitle="Open tickets">
      <View className="gap-xs">
        {Object.entries(breakdown).map(([priority, value]) => (
          <View key={priority} className="gap-1">
            <View className="flex-row justify-between">
              <Text variant="caption" color="textSecondary">
                {titleize(priority)}
              </Text>
              <Text variant="caption" color="textSecondary">
                {value}
              </Text>
            </View>
            <View className="h-1.5 overflow-hidden rounded-pill bg-surface-secondary">
              <View className="h-full rounded-pill" style={{ width: `${(value / total) * 100}%`, backgroundColor: coral }} />
            </View>
          </View>
        ))}
      </View>
    </KpiCard>
  );
}
