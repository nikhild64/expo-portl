import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { Screen, Button, EmptyState } from '@/components';
import { confirmSignOut } from '@/lib/alert';
import { useLocale } from '@/hooks/useLocale';
import { routeForAuthenticatedUser } from '@/lib/authRoutes';
import { useAuthStore } from '@/stores/authStore';

export default function PendingApproval() {
  const { t } = useLocale();
  const [refreshing, setRefreshing] = useState(false);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useAuthStore((s) => s.profile);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const isGuard = profile?.role === 'guard';

  useEffect(() => {
    if (isBootstrapping || !profile) return;

    if (profile.status === 'blocked') {
      void signOut();
      return;
    }

    if (profile.status !== 'pending') {
      router.replace(routeForAuthenticatedUser(profile));
    }
  }, [isBootstrapping, profile, signOut]);

  const isPending = profile?.status === 'pending';

  useFocusEffect(
    useCallback(() => {
      if (isBootstrapping || !isPending) return;

      void refreshProfile({ force: true });

      const interval = setInterval(() => {
        void refreshProfile({ force: true });
      }, 30_000);

      return () => clearInterval(interval);
    }, [isBootstrapping, isPending, refreshProfile]),
  );

  const handleSignOut = () => {
    confirmSignOut(t, signOut, {
      titleKey: 'alert.titles.signOut',
      messageKey: 'alert.messages.returnSignInScreen',
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile({ force: true });
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
