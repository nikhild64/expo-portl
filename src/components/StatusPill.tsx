import { View } from 'react-native';

import type { ThemeColor } from '@/theme';

import { IconSymbol, type IconName } from './IconSymbol';
import { Text } from './Text';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneBgClass: Record<Tone, string> = {
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  danger: 'bg-error/15',
  info: 'bg-info/15',
  neutral: 'bg-text-tertiary/15',
};

const toneColor: Record<Tone, ThemeColor> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
  neutral: 'textSecondary',
};

interface Props {
  tone: Tone;
  label: string;
  icon?: IconName;
}

export function StatusPill({ tone, label, icon }: Props) {
  return (
    <View className={`flex-row items-center gap-1 px-2 py-1 rounded-pill ${toneBgClass[tone]}`}>
      {icon && <IconSymbol name={icon} size={12} color={toneColor[tone]} />}
      <Text variant="caption" color={toneColor[tone]}>
        {label}
      </Text>
    </View>
  );
}
