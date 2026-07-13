import { Pressable, View } from 'react-native';

import { Card, IconSymbol, Text } from '@/components';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function PollOption({ label, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!selected }}>
      <Card variant={selected ? 'filled' : 'outlined'} className="flex-row items-center gap-md">
        <View className={`h-6 w-6 rounded-pill items-center justify-center ${selected ? 'bg-coral' : 'border border-border'}`}>
          {selected && <IconSymbol name="check_circle" size={16} color="onPrimary" />}
        </View>
        <Text variant="body" className="flex-1">
          {label}
        </Text>
      </Card>
    </Pressable>
  );
}
