import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { useAuthStore } from '@/stores/authStore';

const SPLASH_ICON = require('@/assets/images/splash-icon.png');
const SPLASH_ICON_DARK = require('@/assets/images/splash-icon-dark.png');
const SPLASH_SIZE = 120;
const PULSE_DURATION_MS = 700;
const EXIT_DURATION_MS = 350;
const MATERIAL_EASE = Easing.bezier(0.2, 0, 0, 1);

interface AuthTransitionOverlayProps {
  appReady: boolean;
}

export function AuthTransitionOverlay({ appReady }: AuthTransitionOverlayProps) {
  const authTransition = useAuthStore((s) => s.authTransition);
  const { theme } = useUniwind();
  const shouldShow = !appReady || authTransition !== null;

  const [mounted, setMounted] = useState(shouldShow);
  const wasVisible = useRef(shouldShow);
  const overlayOpacity = useSharedValue(shouldShow ? 1 : 0);
  const iconScale = useSharedValue(1);
  const iconOpacity = useSharedValue(1);

  useEffect(() => {
    if (shouldShow) {
      setMounted(true);
      overlayOpacity.value = 1;
      wasVisible.current = true;

      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: PULSE_DURATION_MS, easing: MATERIAL_EASE }),
          withTiming(1, { duration: PULSE_DURATION_MS, easing: MATERIAL_EASE }),
        ),
        -1,
        false,
      );
      iconOpacity.value = withRepeat(
        withSequence(
          withTiming(0.88, { duration: PULSE_DURATION_MS, easing: MATERIAL_EASE }),
          withTiming(1, { duration: PULSE_DURATION_MS, easing: MATERIAL_EASE }),
        ),
        -1,
        false,
      );
      return;
    }

    if (!wasVisible.current) return;
    wasVisible.current = false;

    cancelAnimation(iconScale);
    cancelAnimation(iconOpacity);
    iconScale.value = withTiming(1, { duration: 150, easing: MATERIAL_EASE });
    iconOpacity.value = withTiming(1, { duration: 150, easing: MATERIAL_EASE });

    overlayOpacity.value = withTiming(0, { duration: EXIT_DURATION_MS, easing: MATERIAL_EASE }, (finished) => {
      if (finished) runOnJS(setMounted)(false);
    });
  }, [shouldShow, overlayOpacity, iconScale, iconOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  if (!mounted) return null;

  const icon = theme === 'dark' ? SPLASH_ICON_DARK : SPLASH_ICON;

  return (
    <Animated.View
      className="absolute inset-0 z-[999] items-center justify-center bg-bg"
      style={overlayStyle}
      pointerEvents={shouldShow ? 'auto' : 'none'}
    >
      <Animated.View style={iconStyle}>
        <Image source={icon} style={{ width: SPLASH_SIZE, height: SPLASH_SIZE }} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}
