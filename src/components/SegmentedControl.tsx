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
  className?: string;
}

export function SegmentedControl<T extends string>({ segments, value, onChange, className }: Props<T>) {
  return (
    <View
      className={`flex-row gap-xs rounded-md bg-surface-secondary p-xs${className ? ` ${className}` : ''}`}
      style={{ borderCurve: 'continuous' }}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;

        return (
          <Pressable
            key={segment.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(segment.value)}
            className={`flex-1 items-center rounded-sm py-sm px-sm${selected ? ' bg-coral' : ''}`}
            style={{ borderCurve: 'continuous' }}
            android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
          >
            {selected ? (
              <Animated.View entering={FadeIn.duration(150)} layout={LinearTransition.duration(200)}>
                <Text variant="subhead" color="onPrimary">
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
