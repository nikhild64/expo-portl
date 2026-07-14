import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useThemeColors } from '@/theme/useThemeColors';

export function DuesHeroBackground() {
  const { surface, surfaceSecondary, coralLight } = useThemeColors();

  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="duesHeroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={surfaceSecondary} />
            <Stop offset="55%" stopColor={surface} />
            <Stop offset="100%" stopColor={surface} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#duesHeroGradient)" />
        <Circle cx="92%" cy="12%" r="36" fill={coralLight} opacity={0.45} />
        <Circle cx="98%" cy="6%" r="22" fill={coralLight} opacity={0.3} />
        <Circle cx="84%" cy="4%" r="14" fill={coralLight} opacity={0.25} />
      </Svg>
    </View>
  );
}
