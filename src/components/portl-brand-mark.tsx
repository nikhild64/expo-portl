import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const VIEWBOX = 120;
const MATERIAL_EASE = Easing.bezier(0.2, 0, 0, 1);

/** Thick rounded P body (coral). */
const P_BODY_PATH =
  'M 26 14 C 24 14 22 16 22 18 V 104 C 22 106 24 108 26 108 H 36 C 38 108 40 106 40 104 V 76 H 44 C 58 76 70 64 70 50 C 70 36 58 24 44 24 H 40 V 18 C 40 16 38 14 36 14 H 26 Z';

/** Arch gate at the bottom of the P stem. */
const GATE_PATH = 'M 44 88 C 44 88 48 78 52 78 C 56 78 60 88 60 88 V 104 H 44 V 88 Z';

const DOT_POSITIONS = [
  { x: 14, y: 30 },
  { x: 14, y: 48 },
  { x: 14, y: 66 },
] as const;

const DOT_SIZE = 6;

export type PortlBrandMarkPhase = 'loading' | 'success' | 'idle';

interface PortlBrandMarkProps {
  phase: PortlBrandMarkPhase;
  size?: number;
}

export function PortlBrandMark({ phase, size = 120 }: PortlBrandMarkProps) {
  const coral = useCSSVariable('--color-coral') as string;
  const sage = useCSSVariable('--color-sage') as string;
  const gateColor = useCSSVariable('--color-text-primary') as string;
  const checkColor = useCSSVariable('--color-text-inverse') as string;

  const bodyScale = useSharedValue(0.88);
  const gateTranslateY = useSharedValue(0);
  const dot0Opacity = useSharedValue(0.35);
  const dot1Opacity = useSharedValue(0.35);
  const dot2Opacity = useSharedValue(0.35);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  const dotOpacities = [dot0Opacity, dot1Opacity, dot2Opacity];

  useEffect(() => {
    bodyScale.value = withSpring(1, { damping: 12, stiffness: 120 });
  }, [bodyScale]);

  useEffect(() => {
    if (phase === 'loading') {
      gateTranslateY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 700, easing: MATERIAL_EASE }),
          withTiming(0, { duration: 700, easing: MATERIAL_EASE }),
        ),
        -1,
        false,
      );

      dotOpacities.forEach((opacity, index) => {
        opacity.value = withDelay(
          index * 120,
          withRepeat(
            withSequence(
              withTiming(0.35, { duration: 120 }),
              withTiming(1, { duration: 400, easing: MATERIAL_EASE }),
              withTiming(0.35, { duration: 400, easing: MATERIAL_EASE }),
            ),
            -1,
            false,
          ),
        );
      });

      checkScale.value = 0;
      checkOpacity.value = 0;
      return;
    }

    if (phase === 'success') {
      gateTranslateY.value = withTiming(-8, { duration: 280, easing: MATERIAL_EASE });
      checkOpacity.value = withTiming(1, { duration: 150 });
      checkScale.value = withSpring(1, { damping: 8, stiffness: 100 });
      dotOpacities.forEach((opacity) => {
        opacity.value = withTiming(0, { duration: 200 });
      });
      return;
    }

    gateTranslateY.value = 0;
    checkScale.value = 0;
    checkOpacity.value = 0;
    dotOpacities.forEach((opacity) => {
      opacity.value = 0.35;
    });
  }, [phase, bodyScale, gateTranslateY, checkScale, checkOpacity, dotOpacities]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bodyScale.value }],
  }));

  const gateProps = useAnimatedProps(() => ({
    transform: [{ translateY: gateTranslateY.value }],
  }));

  const dot0Props = useAnimatedProps(() => ({ opacity: dot0Opacity.value }));
  const dot1Props = useAnimatedProps(() => ({ opacity: dot1Opacity.value }));
  const dot2Props = useAnimatedProps(() => ({ opacity: dot2Opacity.value }));
  const dotAnimatedProps = [dot0Props, dot1Props, dot2Props];

  const checkBadgeProps = useAnimatedProps(() => ({
    opacity: checkOpacity.value,
    transform: [
      { translateX: 88 },
      { translateY: 96 },
      { scale: checkScale.value },
      { translateX: -88 },
      { translateY: -96 },
    ],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={containerStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
          <Path d={P_BODY_PATH} fill={coral} />

          {DOT_POSITIONS.map((dot, index) => (
            <AnimatedRect
              key={dot.y}
              x={dot.x}
              y={dot.y}
              width={DOT_SIZE}
              height={DOT_SIZE}
              rx={1.5}
              fill={gateColor}
              animatedProps={dotAnimatedProps[index]}
            />
          ))}

          <AnimatedG animatedProps={gateProps}>
            <Path d={GATE_PATH} fill={gateColor} />
          </AnimatedG>

          <AnimatedG animatedProps={checkBadgeProps}>
            <Circle cx={88} cy={96} r={14} fill={sage} />
            <Path
              d="M 81 96 L 86 101 L 95 90"
              stroke={checkColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </AnimatedG>
        </Svg>
      </Animated.View>
    </View>
  );
}
