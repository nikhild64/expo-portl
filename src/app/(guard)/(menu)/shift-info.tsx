import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, Screen, Text } from '@/components';

export default function GuardShiftInfoScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll variant="tab">
      <Card className="gap-md">
        <View className="flex-row items-center gap-sm">
          <IconSymbol name="schedule" color="coral" size={24} />
          <Text variant="title">{t('guard.alerts.shiftInfo')}</Text>
        </View>
        <Text variant="body" color="textSecondary">
          {t('alert.messages.currentShift')}
        </Text>
        <Text variant="footnote" color="textTertiary">
          {t('guard.alerts.shiftInfoMsg')}
        </Text>
      </Card>
    </Screen>
  );
}
