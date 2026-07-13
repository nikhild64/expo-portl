import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconSymbol, Text } from '@/components';

interface Props {
  onPress: () => void;
}

export function RaiseTicketFab({ onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('nav.screens.raiseTicket')}
      className="absolute bottom-6 right-base flex-row items-center gap-sm rounded-pill bg-coral px-lg py-md shadow-lg"
      style={{ elevation: 6 }}
    >
      <IconSymbol name="add" size={22} color="onPrimary" />
      <Text variant="subhead" color="onPrimary">
        {t('nav.screens.raiseTicket')}
      </Text>
    </Pressable>
  );
}
