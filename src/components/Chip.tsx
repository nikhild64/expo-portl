import { Pressable } from 'react-native';

import { IconSymbol, type IconName } from './IconSymbol';
import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  variant?: 'filter' | 'assist';
  icon?: IconName;
  count?: number;
  onPress?: () => void;
  className?: string;
}

export function Chip({
  label,
  selected = false,
  variant = 'filter',
  icon,
  count,
  onPress,
  className,
}: Props) {
  const isSelectedFilter = variant === 'filter' && selected;
  const containerClass = isSelectedFilter
    ? 'bg-coral border-coral'
    : variant === 'assist'
      ? 'bg-surface border-border'
      : 'bg-surface-secondary border-border';
  const contentColor = isSelectedFilter ? 'onPrimary' : 'textPrimary';

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
      className={`flex-row items-center gap-xs px-md py-sm rounded-sm border ${containerClass}${className ? ` ${className}` : ''}`}
    >
      {icon && <IconSymbol name={icon} size={16} color={contentColor} />}
      <Text variant="subhead" color={contentColor}>
        {label}
        {count !== undefined ? ` ${count}` : ''}
      </Text>
    </Pressable>
  );
}
