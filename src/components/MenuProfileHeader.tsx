import { Pressable, View } from 'react-native';
import { useUniwind } from 'uniwind';

import { Avatar } from './Avatar';
import { IconSymbol } from './IconSymbol';
import { Text } from './Text';

interface Props {
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
  onPress: () => void;
  accessibilityLabel?: string;
}

function rippleColor(theme: string): string {
  return theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
}

/** Tappable menu header — avatar, name, role subtitle, opens profile. */
export function MenuProfileHeader({ name, subtitle, avatarUrl, onPress, accessibilityLabel }: Props) {
  const { theme } = useUniwind();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      android_ripple={{ color: rippleColor(theme) }}
      className="flex-row items-center gap-md rounded-lg bg-surface px-base py-md shadow-elevation-sm"
      style={{ borderCurve: 'continuous' }}
    >
      <Avatar name={name} uri={avatarUrl ?? undefined} size="lg" />
      <View className="flex-1 gap-0.5">
        <Text variant="title">{name}</Text>
        <Text variant="footnote" color="textSecondary">
          {subtitle}
        </Text>
      </View>
      <IconSymbol name="chevron_right" size={20} color="textTertiary" />
    </Pressable>
  );
}
