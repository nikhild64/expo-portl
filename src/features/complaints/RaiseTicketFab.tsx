import { Pressable } from 'react-native';

import { IconSymbol, Text } from '@/components';

interface Props {
  onPress: () => void;
}

export function RaiseTicketFab({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Raise ticket"
      className="absolute bottom-6 right-base flex-row items-center gap-sm rounded-pill bg-coral px-lg py-md shadow-lg"
      style={{ elevation: 6 }}
    >
      <IconSymbol name="add" size={22} color="onPrimary" />
      <Text variant="subhead" color="onPrimary">
        Raise ticket
      </Text>
    </Pressable>
  );
}
