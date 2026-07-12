import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { Card, Text } from '@/components';
import { colorVariable } from '@/lib/classNames';
import type { ThemeColor } from '@/theme';

type Stat = {
  label: string;
  value?: number;
  color: ThemeColor;
  points: string;
};

interface Props {
  inside?: number;
  pending?: number;
  today?: number;
}

export function StatStrip({ inside, pending, today }: Props) {
  const success = useCSSVariable(colorVariable.success) as string;
  const warning = useCSSVariable(colorVariable.warning) as string;
  const coral = useCSSVariable(colorVariable.coral) as string;
  const stats: Stat[] = [
    { label: 'Inside', value: inside, color: 'success', points: '0,18 8,18 16,8 24,14 32,6 40,12 48,4' },
    { label: 'Pending', value: pending, color: 'warning', points: '0,16 8,8 16,14 24,6 32,12 40,10 48,12' },
    { label: 'Today', value: today, color: 'coral', points: '0,18 8,8 16,14 24,8 32,12 40,6 48,12' },
  ];

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
          <Svg width={48} height={22}>
            <Polyline
              points={stat.points}
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke={stat.color === 'success' ? success : stat.color === 'warning' ? warning : coral}
            />
          </Svg>
        </View>
      ))}
    </Card>
  );
}
