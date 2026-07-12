import { KpiCard } from './KpiCard';
import { Sparkline } from './Sparkline';

interface Props {
  count?: number;
  previous?: number;
  trend?: number[];
}

export function KpiVisitors({ count = 0, previous = 0, trend = [] }: Props) {
  const delta = count - previous;
  const subtitle = delta === 0 ? 'Same as yesterday' : `${delta > 0 ? '+' : ''}${delta} vs yesterday`;

  return (
    <KpiCard label="Visitors" value={count} subtitle={subtitle}>
      <Sparkline data={trend.length ? trend : [0, 1, 0, 2, 1, 3, count]} />
    </KpiCard>
  );
}
