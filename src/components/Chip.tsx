import { Pressable } from 'react-native';

import { IconSymbol, type IconName } from './IconSymbol';
import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  variant?: 'filter' | 'assist';
  icon?: IconName;
  count?: number;
  onPress?: () => void;
  className?: string;
  accessibilityLabel?: string;
}

export function Chip({
  label,
  selected = false,
  disabled,
  variant = 'filter',
  icon,
  count,
  onPress,
  className,
  accessibilityLabel,
}: Props) {
  const isSelectedFilter = variant === 'filter' && selected;
  const isSelectedAssist = variant === 'assist' && selected;
  const containerClass =
    isSelectedFilter || isSelectedAssist
      ? 'bg-coral border-coral'
      : variant === 'assist'
        ? 'bg-surface border-border'
        : 'bg-surface-secondary border-border';
  const contentColor = isSelectedFilter || isSelectedAssist ? 'onPrimary' : 'textPrimary';
  const countLabel = count !== undefined ? String(count) : '';
  const visibleLabel = [label, countLabel].filter(Boolean).join(' ');
  const resolvedAccessibilityLabel = accessibilityLabel ?? (visibleLabel || 'Chip');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      accessibilityLabel={resolvedAccessibilityLabel}
      android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
      className={`flex-row items-center gap-xs px-md py-sm rounded-sm border ${containerClass}${className ? ` ${className}` : ''}`}
    >
      {icon && <IconSymbol name={icon} size={16} color={contentColor} />}
      {visibleLabel ? (
        <Text variant="subhead" color={contentColor}>
          {visibleLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}
