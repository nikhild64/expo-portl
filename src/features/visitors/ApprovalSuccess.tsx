import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { IconSymbol, Text } from '@/components';

export function ApprovalSuccess() {
  const sage = useCSSVariable('--color-sage') as string;
  const sageLight = useCSSVariable('--color-sage-light') as string;
  const scale = useSharedValue(0.3);
  const ringScale = useSharedValue(0.85);
  const ringOpacity = useSharedValue(0.45);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
    ringScale.value = withTiming(1.45, { duration: 650 });
    ringOpacity.value = withTiming(0, { duration: 650 });
  }, [ringOpacity, ringScale, scale]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center gap-lg p-base">
      <View className="h-28 w-28 items-center justify-center">
        <Animated.View
          className="absolute h-24 w-24 rounded-pill"
          style={[{ backgroundColor: sageLight }, ringStyle]}
        />
        <Animated.View
          className="h-24 w-24 rounded-pill items-center justify-center"
          style={[{ backgroundColor: sageLight, borderColor: sage, borderWidth: 2 }, circleStyle]}
        >
          <IconSymbol name="check_circle" size={64} color="success" />
        </Animated.View>
      </View>
      <View className="items-center gap-xs">
        <Text variant="title">Visitor approved</Text>
        <Text variant="body" color="textSecondary">
          The gate will update automatically.
        </Text>
      </View>
    </View>
  );
}
