import { useState } from 'react';
import { View } from 'react-native';

import { Screen, Button, EmptyState } from '@/components';
import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';

export default function PendingApproval() {
  const { t } = useLocale();
  const [refreshing, setRefreshing] = useState(false);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useAuthStore((s) => s.profile);
  const isGuard = profile?.role === 'guard';

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center gap-lg">
        <EmptyState
          icon="schedule"
          title={t('auth.pendingApproval.title')}
          subtitle={
            isGuard
              ? t('auth.pendingApproval.guardSubtitle')
              : t('auth.pendingApproval.residentSubtitle')
          }
        />
        <View className="gap-sm">
          <Button
            label={t('auth.pendingApproval.refreshStatus')}
            variant="tonal"
            onPress={handleRefresh}
            loading={refreshing}
            full
          />
          <Button
            label={t('common.signOut')}
            variant="outlined"
            onPress={handleSignOut}
            full
          />
        </View>
      </View>
    </Screen>
  );
}
