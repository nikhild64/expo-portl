import { Pressable, View, type PressableProps } from 'react-native';
import type { ReactNode } from 'react';
import { useUniwind } from 'uniwind';

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

function rowRippleColor(theme: string): string {
  return theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
}

export function ListRow({ left, title, subtitle, right, showChevron, onPress, className, ...rest }: Props) {
  const { theme } = useUniwind();
  const showChev = showChevron ?? !!onPress;
  const rowClass = `flex-row items-center gap-md px-base py-md bg-surface${className ? ` ${className}` : ''}`;

  const content = (
    <>
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
    </>
  );

  if (!onPress) {
    return <View className={rowClass}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? title}
      android_ripple={{ color: rowRippleColor(theme) }}
      className={rowClass}
      {...rest}
    >
      {content}
    </Pressable>
  );
}
