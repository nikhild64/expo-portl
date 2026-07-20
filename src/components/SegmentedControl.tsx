import { Pressable, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Text } from './Text';

interface Segment<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'default' | 'onDark';
  className?: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  variant = 'default',
  className,
}: Props<T>) {
  const containerClass =
    variant === 'onDark'
      ? 'flex-row gap-xs rounded-md border border-border bg-surface-secondary p-xs'
      : 'flex-row gap-xs rounded-md bg-surface-secondary p-xs';

  return (
    <View className={`${containerClass}${className ? ` ${className}` : ''}`} style={{ borderCurve: 'continuous' }}>
      {segments.map((segment) => {
        const selected = segment.value === value;
        const selectedClass =
          variant === 'onDark'
            ? 'border border-border bg-surface-tertiary shadow-sm'
            : 'border border-border/80 bg-surface shadow-sm';
        const unselectedClass = variant === 'onDark' ? 'border border-transparent bg-transparent' : '';

        return (
          <Pressable
            key={segment.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={segment.label}
            onPress={() => onChange(segment.value)}
            className={`flex-1 items-center rounded-sm py-sm px-sm${selected ? ` ${selectedClass}` : ` ${unselectedClass}`}`}
            style={{ borderCurve: 'continuous' }}
            android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
          >
            {selected ? (
              <Animated.View entering={FadeIn.duration(150)} layout={LinearTransition.duration(200)}>
                <Text variant="subhead" color="textPrimary" className="font-semibold">
                  {segment.label}
                </Text>
              </Animated.View>
            ) : (
              <Text variant="subhead" color="textSecondary">
                {segment.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
