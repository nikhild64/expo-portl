import { useTranslation } from 'react-i18next';

import { formatCompactNumber } from '@/lib/format';

import { KpiCard } from './KpiCard';
import { Sparkline } from './Sparkline';

interface Props {
  count?: number;
  previous?: number;
  trend?: number[];
  onPress?: () => void;
}

export function KpiVisitors({ count = 0, previous = 0, trend = [], onPress }: Props) {
  const { t } = useTranslation();
  const delta = count - previous;
  const subtitle = delta === 0 ? 'Same as yesterday' : `${delta > 0 ? '+' : ''}${delta} vs yesterday`;

  return (
    <KpiCard label={t('admin.dashboard.kpiVisitors')} value={formatCompactNumber(count)} subtitle={subtitle} onPress={onPress}>
      <Sparkline data={trend.length ? trend : [0, 1, 0, 2, 1, 3, count]} />
    </KpiCard>
  );
}
