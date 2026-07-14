import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Screen, Text } from '@/components';
import { EntryTypeGrid } from '@/features/guard/EntryTypeGrid';

export default function AddVisitorScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll variant="tab">
      <View className="gap-xs">
        <Text variant="titleLarge">{t('guard.add.whoAtGate')}</Text>
        <Text variant="body" color="textSecondary">
          {t('guard.add.chooseEntryType')}
        </Text>
      </View>
      <EntryTypeGrid compact />
      <Button
        label={t('guard.add.scanPreapprovalQr')}
        icon="qr_code_scanner"
        variant="outlined"
        onPress={() => router.push('/(guard)/(add)/scan')}
      />
    </Screen>
  );
}
