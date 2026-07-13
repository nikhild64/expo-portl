import { Pressable, View } from 'react-native';

import { IconSymbol } from './IconSymbol';
import { Text } from './Text';

interface Props {
  checked: boolean;
  onPress: () => void;
  error?: boolean;
  label?: string;
  className?: string;
}

export function Checkbox({ checked, onPress, error, label, className }: Props) {
  const boxClass = error
    ? 'border-error'
    : checked
      ? 'border-coral bg-coral'
      : 'border-border bg-transparent';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label ?? 'Checkbox'}
      className={`flex-row items-center gap-md${className ? ` ${className}` : ''}`}
    >
      <View className={`h-[22px] w-[22px] items-center justify-center rounded-sm border-2 ${boxClass}`}>
        {checked ? <IconSymbol name="check" size={14} color="onPrimary" /> : null}
      </View>
      {label ? (
        <Text variant="footnote" color="textSecondary" className="flex-1">
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
