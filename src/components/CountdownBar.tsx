import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text } from './Text';

interface Props {
  expiresAt: Date;
  label?: string;
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function CountdownBar({ expiresAt, label = 'Auto-reject in' }: Props) {
  const totalMs = Math.max(expiresAt.getTime() - Date.now(), 1);
  const [remainingMs, setRemainingMs] = useState(() => Math.max(expiresAt.getTime() - Date.now(), 0));
  const progress = useSharedValue(remainingMs / totalMs);

  useEffect(() => {
    const tick = () => {
      const next = Math.max(expiresAt.getTime() - Date.now(), 0);
      setRemainingMs(next);
      progress.value = withTiming(next / totalMs, { duration: 250 });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, progress, totalMs]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progress.value * 100, 0)}%`,
  }));

  return (
    <View className="gap-sm rounded-md bg-coral-light p-md">
      <Text variant="subhead" color="coral">
        {label} {formatRemaining(remainingMs)}
      </Text>
      <View className="h-1.5 overflow-hidden rounded-pill bg-surface">
        <Animated.View className="h-1.5 rounded-pill bg-coral" style={barStyle} />
      </View>
    </View>
  );
}
