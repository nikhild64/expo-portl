import { View } from 'react-native';

import { Text } from '@/components';
import { formatMoney } from '@/lib/format';

import { KpiCard } from './KpiCard';
import { ProgressRing } from './ProgressRing';

interface Props {
  collected?: number;
  total?: number;
  percent?: number;
}

export function KpiDues({ collected = 0, total = 0, percent = 0 }: Props) {
  return (
    <KpiCard label="Dues" value={`${percent}%`} subtitle={`${formatMoney(collected)} / ${formatMoney(total)}`}>
      <View className="flex-row items-center gap-md">
        <ProgressRing percent={percent} />
        <Text variant="footnote" color="textSecondary" className="flex-1">
          Monthly collection progress
        </Text>
      </View>
    </KpiCard>
  );
}
