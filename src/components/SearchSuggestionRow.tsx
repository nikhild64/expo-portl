import type { ReactNode } from 'react';
import { View } from 'react-native';

import { IconSymbol, type IconName } from '@/components/IconSymbol';
import { Text } from '@/components/Text';
import type { ThemeColor } from '@/theme';

interface Props {
  icon: IconName;
  iconColor?: ThemeColor;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

export function SearchSuggestionRow({ icon, iconColor = 'coral', title, subtitle, trailing }: Props) {
  return (
    <>
      <IconSymbol name={icon} size={20} color={iconColor} />
      <View className="flex-1">
        <Text variant="headline">{title}</Text>
        {subtitle ? (
          <Text variant="footnote" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? <IconSymbol name="check_circle" size={18} color="success" />}
    </>
  );
}
