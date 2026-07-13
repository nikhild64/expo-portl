import { Pressable, View } from 'react-native';

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
      className={`flex-row items-center gap-md${className ? ` ${className}` : ''}`}
    >
      <View className={`h-[22px] w-[22px] items-center justify-center rounded-sm border-2 ${boxClass}`}>
        {checked ? (
          <Text variant="footnote" color="onPrimary">
            ✓
          </Text>
        ) : null}
      </View>
      {label ? (
        <Text variant="footnote" color="textSecondary" className="flex-1">
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
