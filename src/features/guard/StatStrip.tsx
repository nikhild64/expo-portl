import { useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, type IconName, Text } from '@/components';
import type { ThemeColor } from '@/theme';

type Stat = {
  label: string;
  value?: number;
  color: ThemeColor;
  icon: IconName;
};

interface Props {
  inside?: number;
  pending?: number;
  today?: number;
}

export function StatStrip({ inside, pending, today }: Props) {
  const { t } = useTranslation();
  const stats: Stat[] = useMemo(
    () => [
      { label: t('guard.log.inside'), value: inside, color: 'success', icon: 'login' },
      { label: t('guard.log.pending'), value: pending, color: 'warning', icon: 'pending_actions' },
      { label: t('guard.log.todayStat'), value: today, color: 'coral', icon: 'calendar_today' },
    ],
    [inside, pending, t, today],
  );

  return (
    <Card className="flex-row items-center justify-between" padding="sm">
      {stats.map((stat, index) => (
        <View key={stat.label} className={`flex-1 items-center gap-xs${index > 0 ? ' border-l border-border' : ''}`}>
          <Text variant="title" color={stat.color} style={{ fontVariant: ['tabular-nums'] }}>
            {stat.value ?? 0}
          </Text>
          <Text variant="footnote" color="textSecondary">
            {stat.label}
          </Text>
          <IconSymbol name={stat.icon} size={22} color={stat.color} />
        </View>
      ))}
    </Card>
  );
}
