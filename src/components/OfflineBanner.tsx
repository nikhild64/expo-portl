import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { IconSymbol } from './IconSymbol';
import { Text } from './Text';

export function OfflineBanner() {
  const { t } = useTranslation();
  const { offline, pendingCount } = useOfflineQueue();

  if (!offline && pendingCount === 0) return null;

  return (
    <View className="flex-row items-center justify-center gap-sm bg-warning px-base py-sm">
      <IconSymbol name="warning_amber" size={16} color="onPrimary" />
      <Text variant="footnote" color="onPrimary">
        {offline
          ? pendingCount > 0
            ? t('common.offlineWithPending', { count: pendingCount })
            : t('common.offline')
          : t('common.offlineSyncing', { count: pendingCount })}
      </Text>
    </View>
  );
}
