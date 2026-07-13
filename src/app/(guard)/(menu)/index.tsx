import { View } from 'react-native';
import { alert } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, IconSymbol, ListRow, Screen, Text } from '@/components';
import { useGuardNavigation } from '@/lib/useGuardNavigation';
import { useAuthStore } from '@/stores/authStore';

export default function GuardMenuScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const guardNav = useGuardNavigation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="flex-row items-center gap-md">
        <Avatar name={profile?.full_name ?? 'Guard'} uri={profile?.avatar_url ?? undefined} size="lg" />
        <View className="flex-1">
          <Text variant="title">{profile?.full_name ?? 'Guard'}</Text>
          <Text variant="footnote" color="textSecondary">
            {t('guard.alerts.shiftInfo')}
          </Text>
        </View>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <ListRow
          title={t('nav.screens.notifications')}
          subtitle={t('notifications.channels.visitorApprovalsDesc')}
          left={<IconSymbol name="notifications" color="coral" />}
          onPress={() => guardNav.push('notifications')}
        />
        <ListRow
          title={t('nav.screens.profile')}
          subtitle={t('nav.screens.profile')}
          left={<IconSymbol name="person" color="coral" />}
          onPress={() => router.push('/(guard)/(menu)/profile')}
        />
        <ListRow
          title={t('guard.alerts.shiftInfo')}
          subtitle={t('guard.alerts.shiftInfoMsg')}
          left={<IconSymbol name="schedule" color="coral" />}
          onPress={() => alert(t('alert.titles.shiftInfo'), t('alert.messages.currentShift'))}
        />
        <ListRow
          title={t('nav.screens.raiseAlert')}
          subtitle={t('guard.alerts.urgentNote')}
          left={<IconSymbol name="warning_amber" color="warning" />}
          onPress={() => router.push('/(guard)/(menu)/alerts')}
        />
        <ListRow
          title={t('nav.screens.settings')}
          subtitle={t('settings.notifications')}
          left={<IconSymbol name="settings" color="coral" />}
          onPress={() => guardNav.push('settings')}
        />
      </Card>

      <Card padding="none" className="overflow-hidden">
        <ListRow
          title={t('common.signOut')}
          subtitle={t('guard.menu.signOutMsg')}
          left={<IconSymbol name="lock" color="error" />}
          onPress={handleSignOut}
        />
      </Card>
    </Screen>
  );
}
