import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { formatCompactNumber } from '@/lib/format';

import { KpiCard } from './KpiCard';

interface Props {
  usage?: { day: number; count: number; percent: number }[];
  onPress?: () => void;
}

export function KpiAmenities({ usage = [], onPress }: Props) {
  const { t } = useTranslation();
  const total = usage.reduce((sum, row) => sum + row.count, 0);

  return (
    <KpiCard label={t('admin.dashboard.kpiAmenities')} value={formatCompactNumber(total)} subtitle={t('admin.dashboard.kpiBookingsWeek')} onPress={onPress}>
      <View className="flex-row items-end gap-xs">
        {(usage.length ? usage : Array.from({ length: 7 }, (_, day) => ({ day, count: 0, percent: 0 }))).map((row) => (
          <View key={row.day} className="flex-1 items-center gap-xs">
            <View
              className={`w-3 rounded-pill ${row.count > 0 ? 'bg-coral' : 'bg-coral/20'}`}
              style={{ height: Math.max(4, row.percent * 0.38) }}
            />
            <Text variant="caption" color={row.count > 0 ? 'textSecondary' : 'textTertiary'}>
              {row.count}
            </Text>
          </View>
        ))}
      </View>
    </KpiCard>
  );
}
