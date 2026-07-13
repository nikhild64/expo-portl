import { Pressable, View, type PressableProps } from 'react-native';
import type { ReactNode } from 'react';

import { IconSymbol } from './IconSymbol';
import { Text } from './Text';

interface Props extends Omit<PressableProps, 'children'> {
  left?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  showChevron?: boolean;
  className?: string;
}

export function ListRow({ left, title, subtitle, right, showChevron, onPress, className, ...rest }: Props) {
  const showChev = showChevron ?? !!onPress;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      className={`flex-row items-center gap-md px-base py-md bg-surface${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {left}
      <View className="flex-1 gap-0.5">
        <Text variant="headline">{title}</Text>
        {subtitle && (
          <Text variant="footnote" color="textSecondary">
            {subtitle}
          </Text>
        )}
      </View>
      {right}
      {showChev && <IconSymbol name="chevron_right" size={20} color="textTertiary" />}
    </Pressable>
  );
}
