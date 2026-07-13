import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <KpiCard label={t('admin.dashboard.kpiDues')} value={`${percent}%`} subtitle={`${formatMoney(collected)} / ${formatMoney(total)}`}>
      <View className="flex-row items-center gap-md">
        <ProgressRing percent={percent} />
        <Text variant="footnote" color="textSecondary" className="flex-1">
          {t('admin.dashboard.monthlyCollection')}
        </Text>
      </View>
    </KpiCard>
  );
}
