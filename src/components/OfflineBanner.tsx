import { useEffect, useState } from 'react';
import { View } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

import { IconSymbol } from './IconSymbol';
import { Text } from './Text';

export function OfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return unsubscribe;
  }, []);

  if (!offline) return null;

  return (
    <View className="flex-row items-center justify-center gap-sm bg-warning px-base py-sm">
      <IconSymbol name="warning_amber" size={16} color="onPrimary" />
      <Text variant="footnote" color="onPrimary">
        {t('common.offline')}
      </Text>
    </View>
  );
}
