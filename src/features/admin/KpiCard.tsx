import { View } from 'react-native';
import type { ReactNode } from 'react';

import { Card, Text } from '@/components';

interface Props {
  label: string;
  value: string | number;
  subtitle?: string;
  children?: ReactNode;
}

export function KpiCard({ label, value, subtitle, children }: Props) {
  return (
    <Card variant="outlined" className="flex-1 gap-md">
      <View>
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
        <Text variant="titleLarge" style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
        {subtitle && (
          <Text variant="footnote" color="textTertiary">
            {subtitle}
          </Text>
        )}
      </View>
      {children}
    </Card>
  );
}
