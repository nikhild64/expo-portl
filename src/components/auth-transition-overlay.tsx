import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PortlBrandMark, type PortlBrandMarkPhase } from '@/components/portl-brand-mark';
import { useAuthStore } from '@/stores/authStore';

const MATERIAL_EASE = Easing.bezier(0.2, 0, 0, 1);
const EXIT_DURATION_MS = 350;

interface AuthTransitionOverlayProps {
  appReady: boolean;
}

export function AuthTransitionOverlay({ appReady }: AuthTransitionOverlayProps) {
  const authTransition = useAuthStore((s) => s.authTransition);
  const shouldShow = !appReady || authTransition !== null;

  const [mounted, setMounted] = useState(shouldShow);
  const [markPhase, setMarkPhase] = useState<PortlBrandMarkPhase>('loading');
  const wasVisible = useRef(shouldShow);
  const overlayOpacity = useSharedValue(shouldShow ? 1 : 0);
  const overlayScale = useSharedValue(1);

  useEffect(() => {
    if (shouldShow) {
      setMounted(true);
      setMarkPhase('loading');
      overlayOpacity.value = 1;
      overlayScale.value = 1;
      wasVisible.current = true;
      return;
    }

    if (!wasVisible.current) return;
    wasVisible.current = false;

    setMarkPhase('success');

    const finishExit = () => {
      setMounted(false);
      setMarkPhase('idle');
    };

    const exitTimer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, { duration: EXIT_DURATION_MS, easing: MATERIAL_EASE });
      overlayScale.value = withTiming(
        1.04,
        { duration: EXIT_DURATION_MS, easing: MATERIAL_EASE },
        (finished) => {
          if (finished) runOnJS(finishExit)();
        },
      );
    }, 220);

    return () => clearTimeout(exitTimer);
  }, [shouldShow, overlayOpacity, overlayScale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }));

  if (!mounted) return null;

  return (
    <Animated.View
      className="absolute inset-0 z-[999] items-center justify-center bg-bg"
      style={overlayStyle}
      pointerEvents={shouldShow || markPhase === 'success' ? 'auto' : 'none'}
    >
      <PortlBrandMark phase={markPhase} />
    </Animated.View>
  );
}
