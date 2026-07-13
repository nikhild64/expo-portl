import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: 'sm' | 'md' | 'lg' | 'pill';
  className?: string;
  style?: ViewStyle;
}

const radiusClass = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', pill: 'rounded-pill' } as const;

export function Skeleton({ width = '100%', height = 16, radius = 'sm', className, style }: Props) {
  const borderColor = useCSSVariable('--color-border') as string;
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, backgroundColor: borderColor }, anim, style]}
      className={`${radiusClass[radius]}${className ? ` ${className}` : ''}`}
    />
  );
}

export function SkeletonRow() {
  return (
    <View className="flex-row gap-md p-base items-center">
      <Skeleton width={40} height={40} radius="pill" />
      <View className="flex-1 gap-sm">
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View className="p-base gap-md">
      <Skeleton width="70%" height={16} />
      <Skeleton width="90%" height={12} />
      <Skeleton width="80%" height={12} />
    </View>
  );
}
